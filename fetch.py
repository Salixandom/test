import psycopg2
from jikanpy import Jikan
from datetime import datetime
import sys
import requests
import time
import os

# Database connection parameters - replace with your details
db_params = {
    'database': 'AniHub',
    'user': 'postgres',
    'password': '1911192',
    'host': 'localhost'
}

# Connect to your database
try:
    conn = psycopg2.connect(**db_params)
except psycopg2.OperationalError as e:
    print(f"Error connecting to the database: {e}")
    sys.exit(1)

# Jikan instance
jikan = Jikan()

# Rate limit parameters
RATE_LIMIT = 60  # requests per second
RATE_LIMIT_PERIOD = 2  # seconds
last_request_time = None


def fetch_with_rate_limit(url):
    global last_request_time
    if last_request_time is not None:
        elapsed = time.time() - last_request_time
        if elapsed < RATE_LIMIT_PERIOD:
            time.sleep(RATE_LIMIT_PERIOD - elapsed)
    response = requests.get(url)
    last_request_time = time.time()
    return response


def fetch_related_anime(anime_id):
    url = f"https://api.jikan.moe/v4/anime/{anime_id}/relations"
    response = fetch_with_rate_limit(url)
    related_anime = response.json()
    return related_anime

def convert_anime_id(anime_id, prefix='A', length=15):
    formatted_id = f"{prefix}{anime_id:0{length - len(prefix)}d}"
    return formatted_id

def check_ongoing_status(anime_data):
    airing_status = anime_data.get('airing', False)
    to_date = anime_data.get('aired', {}).get('to', None)

    if to_date:
        # Convert string date with time to datetime object
        end_date = datetime.strptime(to_date, '%Y-%m-%dT%H:%M:%S%z')

        # Check if the end date is in the future
        return end_date > datetime.now(end_date.tzinfo)

    return airing_status


def fetch_all_episodes(anime_id):
    try:
        episodes = jikan.anime(anime_id, extension='episodes')
        episodes = episodes.get('data', [])
        page = 2
        while episodes:
            more_episodes = jikan.anime(anime_id, extension='episodes', page=page)
            more_episodes = more_episodes.get('data', [])
            if not more_episodes:
                break
            episodes.extend(more_episodes)
            page += 1
            time.sleep(2)  # Introduce a small delay to avoid hitting the rate limit
        return episodes
    except Exception as e:
        print(f"Error fetching anime episodes: {e}")
        return []

def fetch_and_insert_anime(anime_id):
    try:
        # Fetch anime data from Jikan
        time.sleep(2)
        anime_raw_data = jikan.anime(anime_id)
        anime_data = anime_raw_data['data']
        formatted_anime_id = convert_anime_id(anime_id)
        
        print(f"Processing anime ID: {anime_id}")

        # for ongoing status
        is_ongoing = check_ongoing_status(anime_data)
        
        # for airing season
        aired = anime_data.get('aired', {})
        from_date = aired.get('from', None)
        
        if from_date:
            # Convert string date with time to datetime object
            start_date = datetime.strptime(from_date, '%Y-%m-%dT%H:%M:%S%z')

            # Convert the datetime object to a string without the time component
            start_date_str = start_date.strftime('%Y-%m-%d')

            # Determine the season based on the month
            month = start_date.month
            year = start_date.year

            if 3 <= month <= 5:
                season = 'Spring'
            elif 6 <= month <= 8:
                season = 'Summer'
            elif 9 <= month <= 11:
                season = 'Fall'
            else:
                season = 'Winter'

            airing_season = f"{season} {year}"
        else:
            airing_season = "Unknown"

        # Insert data into anime_table
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO anime_table (anime_id, title, release_date, description, cover_image, average_rating, runtime, language, ongoing_status, airing_season, favorites, source, showtype, top_image, title_japanese, title_synonyms, episode_no, rated)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING anime_id;
            """, (
                formatted_anime_id, anime_data.get('title'), anime_data.get('aired', {}).get('from'),
                anime_data.get('synopsis'), anime_data.get('images', {}).get('jpg', {}).get('image_url'),
                anime_data.get('score'), anime_data.get('duration'),
                anime_data.get('broadcast', {}).get('language', 'Japanese'), is_ongoing, airing_season,
                anime_data.get('favorites'), anime_data.get('source'), anime_data.get('type'),
                anime_data.get('trailer', {}).get('images', {}).get('maximum_image_url'),
                anime_data.get('title_japanese'), anime_data.get('title_synonyms'), anime_data.get('episodes'), anime_data.get('rating')
            ))
            
            anime_table_id = cur.fetchone()[0]

        # insert related anime into season table
        related_anime = fetch_related_anime(anime_id).get('data')
        for related in related_anime:
            entry = related.get('entry')
            for element in entry:
                type = element.get('type')
                if type == 'anime':
                    related_anime_id = element.get('mal_id')
                    formatted_related_id = convert_anime_id(related_anime_id)
                    relation = related.get('relation')
                    with conn.cursor() as cur:
                        cur.execute("""
                        INSERT INTO season (base_anime_id, related_anime_id, relation_type)
                        VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;
                    """, (formatted_anime_id, formatted_related_id, relation))

        
        #insert episodes into episode table
        episodes = fetch_all_episodes(anime_id)
        for episode in episodes:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO episode (anime_id, episode_no, title, release_date, score)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                """, (formatted_anime_id, episode.get('mal_id'), episode.get('title'), episode.get('aired'), episode.get('score') ))
        
        
        # Insert genres and link with anime
        for genre in anime_data.get('genres', []):
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO genre (genre_name) VALUES (%s)
                    ON CONFLICT (genre_name) DO UPDATE SET genre_name = EXCLUDED.genre_name
                    RETURNING genre_id;
                """, (genre.get('name'),))
                genre_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO anime_genre (anime_id, genre_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (anime_table_id, genre_id))
                
        for ex_genre in anime_data.get('explicit_genres', []):
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO genre (genre_name) VALUES (%s)
                    ON CONFLICT (genre_name) DO UPDATE SET genre_name = EXCLUDED.genre_name
                    RETURNING genre_id;
                """, (ex_genre.get('name'),))
                ex_genre_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO anime_genre (anime_id, genre_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (anime_table_id, ex_genre_id))


        # insert into keywords
        for keyword in anime_data.get('themes', []):
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO keyword (keyword_name) VALUES (%s)
                    ON CONFLICT (keyword_name) DO UPDATE SET keyword_name = EXCLUDED.keyword_name
                    RETURNING keyword_id;
                """, (keyword.get('name'),))
                keyword_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO anime_keyword (anime_id, keyword_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (anime_table_id, keyword_id))


        # Fetch and insert characters and voice actors
        time.sleep(2)
        characters_stuff = jikan.anime(anime_id, extension='characters')['data']
        for characters in characters_stuff:
            character = characters.get('character', [])
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO character (name, image, anime_id) VALUES (%s, %s, %s)
                    RETURNING character_id;
                """, (character.get('name'), character.get('images', {}).get('jpg', {}).get('image_url'),
                      anime_table_id))
                character_id = cur.fetchone()[0]

                for va in characters.get('voice_actors', []):
                    cur.execute("""
                        INSERT INTO voice_actor (name, language, image) VALUES (%s, %s, %s)
                        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                        RETURNING va_id;
                    """, (va.get('person', {}).get('name'), va.get('language'),
                          va.get('person', {}).get('images', {}).get('jpg', {}).get('image_url')))
                    va_id = cur.fetchone()[0]
                    cur.execute("""
                        INSERT INTO character_voice_actor (character_id, va_id) VALUES (%s, %s)
                        ON CONFLICT (character_id, va_id) DO UPDATE SET character_id = EXCLUDED.character_id, va_id = EXCLUDED.va_id;
                    """, (character_id, va_id))


        # fetching into studio table
        studios = anime_data.get("studios", [])
        for studio in studios:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO studio (studio_name, type) VALUES (%s, %s)
                    ON CONFLICT (studio_name) DO UPDATE SET studio_name = EXCLUDED.studio_name
                    RETURNING studio_id;
                """, (studio.get("name"), "studio"))
                studio_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO anime_studio (anime_id, studio_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (anime_table_id, studio_id))

        licensors = anime_data.get("licensors", [])
        for licensor in licensors:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO studio (studio_name, type) VALUES (%s, %s)
                    ON CONFLICT (studio_name) DO UPDATE SET studio_name = EXCLUDED.studio_name
                    RETURNING studio_id;
                """, (licensor.get("name"), "licensor"))
                licensor_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO anime_studio (anime_id, studio_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (anime_table_id, licensor_id))

        producers = anime_data.get("producers", [])
        for producer in producers:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO studio (studio_name, type) VALUES (%s, %s)
                    ON CONFLICT (studio_name) DO UPDATE SET studio_name = EXCLUDED.studio_name
                    RETURNING studio_id;
                """, (producer.get("name"), "producer"))
                producer_id = cur.fetchone()[0]

                cur.execute("""
                    INSERT INTO anime_studio (anime_id, studio_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (anime_table_id, producer_id))

        # fetching trailer
        trailer = anime_data.get("trailer", [])
        video_url = trailer.get("url")
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO trailer (anime_id, trailer_title, video_url) VALUES (%s, %s, %s)
                ON CONFLICT (video_url) DO UPDATE SET video_url = EXCLUDED.video_url
                RETURNING trailer_id;
            """, (anime_table_id, video_url, anime_data["title"]))

        conn.commit()

    except Exception as e:
        if hasattr(e, 'response') and e.response.status_code == 404:
            print(f"Anime ID {anime_id} not found. Skipping...")
            with open("error_log.txt", "a") as f:
                f.write(f"Anime ID {anime_id} not found. Skipping...\n")
            return  # Skip to the next anime ID
        else:
            print(f"Error processing anime ID {anime_id}: {e}")
            with open("error_log.txt", "a") as f:
                f.write(f"Error processing anime ID {anime_id}: {e}\n")
            """ sys.exit(1) """ # Exit the code if an exception occurs
        

def main():
    for anime_id in range(57243, 60001):
        fetch_and_insert_anime(anime_id)
        time.sleep(2)
    """ fetch_and_insert_anime(918) """

if __name__ == "__main__":
    main()