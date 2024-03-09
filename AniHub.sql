-- Creating encryption method for password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Creating user_table
CREATE TABLE user_table (
    user_id SERIAL PRIMARY KEY,
    reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_picture BYTEA,
    username VARCHAR(255) NOT NULL,
    friends INTEGER[],
    first_name VARCHAR(255) NOT NULL,
    second_name VARCHAR(255)
);

-- Creating anime_table
CREATE TABLE anime_table (
    Anime_ID SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Release_Date DATE,
    Description TEXT,
    Cover_Image VARCHAR(255),
    Average_Rating DECIMAL(3, 2),
    Season_No INTEGER,
    Ongoing_Status BOOLEAN,
    Runtime INTEGER,
    Airing_Season VARCHAR(50),
    Favorites INTEGER,
    Manga BOOLEAN,
    Showtype VARCHAR(50),
    Language VARCHAR(50)
);

-- creating images table

CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    alt_text VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL
);


-- Creating rating table
CREATE TABLE rating (
    Rating_ID SERIAL PRIMARY KEY,
    User_ID INTEGER,
    Anime_ID INTEGER,
    Rating_Score INTEGER,
    FOREIGN KEY (User_ID) REFERENCES user_table(user_id),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Updating the average rating trigger
CREATE OR REPLACE FUNCTION update_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE anime_table
    SET Average_Rating = (
        SELECT AVG(Rating_Score::DECIMAL(4, 2))
        FROM rating
        WHERE rating.Anime_ID = NEW.Anime_ID
    )
    WHERE anime_table.Anime_ID = NEW.Anime_ID;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creating trigger to update average rating on rating changes
CREATE TRIGGER rating_after_insert
AFTER INSERT ON rating
FOR EACH ROW
EXECUTE FUNCTION update_average_rating();

CREATE TRIGGER rating_after_update
AFTER UPDATE ON rating
FOR EACH ROW
EXECUTE FUNCTION update_average_rating();

CREATE TRIGGER rating_after_delete
AFTER DELETE ON rating
FOR EACH ROW
EXECUTE FUNCTION update_average_rating();

-- Creating season table
CREATE TABLE season (
    Season_ID SERIAL PRIMARY KEY,
    Anime_ID INTEGER,
    Season_No INTEGER,
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Creating episode table
CREATE TABLE episode (
    Episode_ID SERIAL PRIMARY KEY,
    Anime_ID INTEGER,
    Episode_No INTEGER,
    Title VARCHAR(255),
    Release_Date DATE,
    Duration INTEGER,
    Season_ID INTEGER,
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID),
    FOREIGN KEY (Season_ID) REFERENCES season(Season_ID)
);

CREATE TABLE trailer (
    Trailer_ID SERIAL PRIMARY KEY,
    Anime_ID INTEGER,
    Trailer_Title VARCHAR(255),
    Video_URL VARCHAR(255), -- You might want to use an appropriate data type for video URLs
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Creating soundtrack table
CREATE TABLE soundtrack (
    Track_ID SERIAL PRIMARY KEY,
    Anime_ID INTEGER,
    Name VARCHAR(255),
    Artist VARCHAR(255),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Creating keyword table
CREATE TABLE keyword (
    Keyword_ID SERIAL PRIMARY KEY,
    Keyword_Name VARCHAR(255) UNIQUE NOT NULL
);

-- Creating anime_keyword junction table
CREATE TABLE anime_keyword (
    Anime_ID INTEGER,
    Keyword_ID INTEGER,
    PRIMARY KEY (Anime_ID, Keyword_ID),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID),
    FOREIGN KEY (Keyword_ID) REFERENCES keyword(Keyword_ID)
);


-- Creating user_watchlist table
CREATE TABLE user_watchlist (
    User_ID INTEGER,
    Anime_ID INTEGER,
    Season_ID INTEGER,
    PRIMARY KEY (User_ID, Anime_ID, Season_ID),
    Status VARCHAR(20), -- Status can be 'Watching', 'Completed', etc.
    FOREIGN KEY (User_ID) REFERENCES user_table(user_id),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID),
    FOREIGN KEY (Season_ID) REFERENCES season(Season_ID)
);

-- Creating review table
CREATE TABLE review (
    Review_ID SERIAL PRIMARY KEY,
    User_ID INTEGER,
    Anime_ID INTEGER,
    Rating_Score INTEGER,
    Review_Text TEXT,
    Review_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (User_ID) REFERENCES user_table(user_id),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Trigger function to update review table after INSERT or UPDATE on rating
CREATE OR REPLACE FUNCTION update_review_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE review
    SET Rating_Score = NEW.Rating_Score
    WHERE User_ID = NEW.User_ID AND Anime_ID = NEW.Anime_ID;

    -- If no rows were updated, do nothing
    IF NOT FOUND THEN
        -- No existing entry found in review table, do nothing
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update review table after INSERT or UPDATE on rating
CREATE TRIGGER update_review_after_rating
AFTER INSERT OR UPDATE ON rating
FOR EACH ROW
EXECUTE FUNCTION update_review_rating();

-- Trigger function to update rating table after INSERT or UPDATE on review
CREATE OR REPLACE FUNCTION update_rating_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rating
    SET Rating_Score = NEW.Rating_Score
    WHERE User_ID = NEW.User_ID AND Anime_ID = NEW.Anime_ID;

    -- If no rows were updated, do nothing
    IF NOT FOUND THEN
        -- No existing entry found in rating table, do nothing
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating table after INSERT or UPDATE on review
CREATE TRIGGER update_rating_after_review
AFTER INSERT OR UPDATE ON review
FOR EACH ROW
EXECUTE FUNCTION update_rating_review();


-- Creating comment table
CREATE TABLE comment (
    Comment_ID SERIAL PRIMARY KEY,
    User_ID INTEGER,
    Anime_ID INTEGER,
    Season_ID INTEGER,
    Episode_ID INTEGER,
    Comment_Text TEXT,
    Comment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Upvote_Count INTEGER DEFAULT 0,
    Downvote_Count INTEGER DEFAULT 0,
    FOREIGN KEY (User_ID) REFERENCES user_table(user_id),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID),
    FOREIGN KEY (Season_ID) REFERENCES season(Season_ID),
    FOREIGN KEY (Episode_ID) REFERENCES episode(Episode_ID)
);

-- Creating reply table
CREATE TABLE reply (
    Reply_ID SERIAL PRIMARY KEY,
    User_ID INTEGER,
    Comment_ID INTEGER,
    Reply_Text TEXT,
    Reply_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Upvote_Count INTEGER DEFAULT 0,
    Downvote_Count INTEGER DEFAULT 0,
    FOREIGN KEY (User_ID) REFERENCES user_table(user_id),
    FOREIGN KEY (Comment_ID) REFERENCES comment(Comment_ID)
);

-- Creating user_favorite_anime_list table
CREATE TABLE user_favorite_anime_list (
    User_ID INTEGER,
    Anime_ID INTEGER,
    PRIMARY KEY (User_ID, Anime_ID),
    FOREIGN KEY (User_ID) REFERENCES user_table(user_id),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Trigger function to update anime_table Favorites column after INSERT or DELETE on user_favorite_anime_list
CREATE OR REPLACE FUNCTION update_anime_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE anime_table
    SET favorites = (
        SELECT COUNT(*) FROM user_favorite_anime_list WHERE anime_id = NEW.anime_id
    )
    WHERE anime_id = NEW.anime_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update anime_table Favorites column after INSERT or DELETE on user_favorite_anime_list
CREATE TRIGGER update_anime_favorites_count_trigger
AFTER INSERT ON user_favorite_anime_list
FOR EACH ROW
EXECUTE FUNCTION update_anime_favorites_count();


-- Creating studio table
CREATE TABLE studio (
    Studio_ID SERIAL PRIMARY KEY,
    Studio_Name VARCHAR(255) NOT NULL,
    Description TEXT,
    Producers VARCHAR(255) -- You can adjust the data type based on your specific needs
);


-- Creating anime_studio junction table
CREATE TABLE anime_studio (
    Anime_ID INTEGER,
    Studio_ID INTEGER,
    PRIMARY KEY (Anime_ID, Studio_ID),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID),
    FOREIGN KEY (Studio_ID) REFERENCES studio(Studio_ID)
);


-- Creating genre table
CREATE TABLE genre (
    Genre_ID SERIAL PRIMARY KEY,
    Genre_Name VARCHAR(255) NOT NULL,
    Description TEXT
);


-- Creating anime_genre junction table
CREATE TABLE anime_genre (
    Anime_ID INTEGER,
    Genre_ID INTEGER,
    PRIMARY KEY (Anime_ID, Genre_ID),
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID),
    FOREIGN KEY (Genre_ID) REFERENCES genre(Genre_ID)
);


-- Creating character table
CREATE TABLE character (
    Character_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Image VARCHAR(255),
    Anime_ID INTEGER,
    FOREIGN KEY (Anime_ID) REFERENCES anime_table(Anime_ID)
);

-- Creating voice_actor table
CREATE TABLE voice_actor (
    VA_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Gender VARCHAR(10),
    Description TEXT,
    Image VARCHAR(255),
    Date_of_Birth DATE
);

-- Creating character_voice_actor junction table
CREATE TABLE character_voice_actor (
    Character_ID INTEGER,
    VA_ID INTEGER,
    PRIMARY KEY (Character_ID, VA_ID),
    FOREIGN KEY (Character_ID) REFERENCES character(Character_ID),
    FOREIGN KEY (VA_ID) REFERENCES voice_actor(VA_ID)
);


-- added new column to user_table

ALTER TABLE user_table
ADD COLUMN display_name VARCHAR(255);

-- added a new trigger that will provide displayname for initial CASE case_value

CREATE OR REPLACE FUNCTION set_display_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL THEN
        NEW.display_name := NEW.first_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_user
BEFORE INSERT ON user_table
FOR EACH ROW EXECUTE FUNCTION set_display_name();


-- altered tables here


--altering usertable with necessary CONSTRAINT

ALTER TABLE user_table
ADD CONSTRAINT unique_email UNIQUE (email),
ADD CONSTRAINT unique_username UNIQUE (username);


--altering animetable with necessary CONSTRAINT

ALTER TABLE anime_table
ADD COLUMN top_image VARCHAR(255),
ADD CONSTRAINT unique_title UNIQUE (title),
ADD CONSTRAINT check_average_rating CHECK (average_rating BETWEEN 0 AND 10),
ADD CONSTRAINT check_runtime CHECK (runtime > 0),
ADD CONSTRAINT check_favorites CHECK (favorites >= 0);


-- altering rating with necessary CONSTRAINT

ALTER TABLE rating
ALTER COLUMN user_ID SET NOT NULL,
ALTER COLUMN anime_ID SET NOT NULL,
ADD CONSTRAINT check_rating_score CHECK (rating_Score BETWEEN 0 AND 10);


-- altering season with necessary CONSTRAINT

ALTER TABLE season
ADD CONSTRAINT unique_anime_season UNIQUE (anime_id, season_no);


-- altering episode with necessaary CONSTRAINT

ALTER TABLE episode
ADD CONSTRAINT unique_anime_season_episode UNIQUE (anime_id, season_id, episode_no);


--altering trailer with necessary CONSTRAINT

ALTER TABLE trailer
ALTER COLUMN anime_id SET NOT NULL;


-- altering soundtrack with necessary CONSTRAINT

ALTER TABLE soundtrack
ALTER COLUMN anime_id SET NOT NULL,
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN artist SET NOT NULL;


-- altering anime-keyword with necessary CONSTRAINT

ALTER TABLE anime_keyword
ALTER COLUMN anime_id SET NOT NULL,
ALTER COLUMN keyword_id SET NOT NULL;


--altering user_watchlist with necessary CONSTRAINT

ALTER TABLE user_watchlist
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN anime_id SET NOT NULL,
ALTER COLUMN season_id SET NOT NULL;


-- altering review with necessary CONSTRAINT

ALTER TABLE review
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN anime_id SET NOT NULL,
ADD CONSTRAINT check_review_rating_score CHECK (rating_score BETWEEN 0 AND 10);


-- altering comment with necessary CONSTRAINT

ALTER TABLE comment
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN comment_text SET NOT NULL;


-- altering reply with necessary CONSTRAINT

ALTER TABLE reply
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN comment_id SET NOT NULL,
ALTER COLUMN reply_text SET NOT NULL;


-- altering comment_vote with necessary CONSTRAINT

ALTER TABLE comment_vote
ADD CONSTRAINT check_vote_value CHECK (vote_value IN (-1, 1));

-- altering reply_vote with necessary CONSTRAINT

ALTER TABLE reply_vote
ADD CONSTRAINT check_vote_value CHECK (vote_value IN (-1, 1));


-- altering user_favorite_anime_list with necessary CONSTRAINT

ALTER TABLE user_favorite_anime_list
ALTER COLUMN user_id SET NOT NULL,
ALTER COLUMN anime_id SET NOT NULL;

-- altering studio with necessary CONSTRAINT

ALTER TABLE studio
ADD CONSTRAINT unique_studio_name UNIQUE (studio_name);

-- altering anime_studio with necessary CONSTRAINT

ALTER TABLE anime_studio
ALTER COLUMN anime_id SET NOT NULL,
ALTER COLUMN studio_id SET NOT NULL;


-- altering genre with necessary CONSTRAINT

ALTER TABLE genre
ADD CONSTRAINT unique_genre_name UNIQUE (genre_name);

-- altering anime_genre with necessary CONSTRAINT

ALTER TABLE anime_genre
ALTER COLUMN anime_id SET NOT NULL,
ALTER COLUMN genre_id SET NOT NULL;


-- altering character WITH necessary CONSTRAINT

ALTER TABLE character
ALTER COLUMN name SET NOT NULL;

-- altering voice_actor with necessary CONSTRAINT

ALTER TABLE voice_actor
ALTER COLUMN name SET NOT NULL;

-- altering character_voice_actor with necessary CONSTRAINT

ALTER TABLE character_voice_actor
ALTER COLUMN character_id SET NOT NULL,
ALTER COLUMN va_id SET NOT NULL;


-- added new table for password recovery

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_table(user_id) ON DELETE CASCADE
);


ALTER TABLE user_table
ADD COLUMN image_id INTEGER REFERENCES images(id);



-- making anime_id in A000000X format

ALTER TABLE anime_table
ALTER COLUMN anime_id TYPE VARCHAR(10);

CREATE OR REPLACE FUNCTION set_serialized_anime_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.anime_id := 'A' || LPAD(NEW.anime_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER before_insert_anime
BEFORE INSERT ON anime_table
FOR EACH ROW EXECUTE FUNCTION set_serialized_anime_id();


ALTER TABLE anime_genre
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE anime_keyword
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE anime_studio
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE character
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE episode
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE soundtrack
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE trailer
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE comment
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE rating
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE review
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE season
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE user_favorite_anime_list
ALTER COLUMN anime_id TYPE VARCHAR(10);

ALTER TABLE user_watchlist
ALTER COLUMN anime_id TYPE VARCHAR(10);

-- adding foreign key CONSTRAINT


ALTER TABLE anime_genre
ADD CONSTRAINT fk_anime_genre_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE anime_keyword
ADD CONSTRAINT fk_anime_keyword_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE anime_studio
ADD CONSTRAINT fk_anime_studio_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE character
ADD CONSTRAINT fk_character_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE episode
ADD CONSTRAINT fk_episode_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE soundtrack
ADD CONSTRAINT fk_soundtrack_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE trailer
ADD CONSTRAINT fk_trailer_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE comment
ADD CONSTRAINT fk_comment_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE rating
ADD CONSTRAINT fk_rating_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE review
ADD CONSTRAINT fk_review_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE season
ADD CONSTRAINT fk_season_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE user_favorite_anime_list
ADD CONSTRAINT fk_user_favorite_anime_list_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);

ALTER TABLE user_watchlist
ADD CONSTRAINT fk_user_watchlist_anime_id
FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id);


-- altering user in U0000X format


-- Changing the data type of user_id in user_table to VARCHAR(10)
ALTER TABLE user_table
ALTER COLUMN user_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized user_id in user_table
CREATE OR REPLACE FUNCTION set_serialized_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := 'U' || LPAD(NEW.user_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_user2
BEFORE INSERT ON user_table
FOR EACH ROW EXECUTE FUNCTION set_serialized_user_id();

-- Adding foreign key constraints for user_id in other tables

ALTER TABLE comment
ALTER COLUMN user_id TYPE VARCHAR(10);

ALTER TABLE reply
ALTER COLUMN user_id TYPE VARCHAR(10);

ALTER TABLE rating
ALTER COLUMN user_id TYPE VARCHAR(10);

ALTER TABLE review
ALTER COLUMN user_id TYPE VARCHAR(10);

ALTER TABLE user_favorite_anime_list
ALTER COLUMN user_id TYPE VARCHAR(10);

ALTER TABLE user_watchlist
ALTER COLUMN user_id TYPE VARCHAR(10);

-- Adding foreign key CONSTRAINT for user_id in each table

ALTER TABLE comment
ADD CONSTRAINT fk_comment_user_id
FOREIGN KEY (user_id) REFERENCES user_table(user_id);

ALTER TABLE reply
ADD CONSTRAINT fk_reply_user_id
FOREIGN KEY (user_id) REFERENCES user_table(user_id);

ALTER TABLE rating
ADD CONSTRAINT fk_rating_user_id
FOREIGN KEY (user_id) REFERENCES user_table(user_id);

ALTER TABLE review
ADD CONSTRAINT fk_review_user_id
FOREIGN KEY (user_id) REFERENCES user_table(user_id);

ALTER TABLE user_favorite_anime_list
ADD CONSTRAINT fk_user_favorite_anime_list_user_id
FOREIGN KEY (user_id) REFERENCES user_table(user_id);

ALTER TABLE user_watchlist
ADD CONSTRAINT fk_user_watchlist_user_id
FOREIGN KEY (user_id) REFERENCES user_table(user_id);


-- altering the genre id in G0000X format

-- Changing the data type of genre_id in genre table to VARCHAR(10)
ALTER TABLE genre
ALTER COLUMN genre_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized genre_id in genre table
CREATE OR REPLACE FUNCTION set_serialized_genre_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.genre_id := 'G' || LPAD(NEW.genre_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_genre
BEFORE INSERT ON genre
FOR EACH ROW EXECUTE FUNCTION set_serialized_genre_id();

-- Adding foreign key constraints for genre_id in other tables

ALTER TABLE anime_genre
ALTER COLUMN genre_id TYPE VARCHAR(10);

-- Adding foreign key CONSTRAINT for genre_id in each table

ALTER TABLE anime_genre
ADD CONSTRAINT fk_anime_genre_genre_id
FOREIGN KEY (genre_id) REFERENCES genre(genre_id);


-- altering the keyword id into K0000X format


-- Changing the data type of keyword_id in keyword table to VARCHAR(10)
ALTER TABLE keyword
ALTER COLUMN keyword_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized keyword_id in keyword table
CREATE OR REPLACE FUNCTION set_serialized_keyword_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.keyword_id := 'K' || LPAD(NEW.keyword_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_keyword
BEFORE INSERT ON keyword
FOR EACH ROW EXECUTE FUNCTION set_serialized_keyword_id();

-- Adding foreign key constraints for keyword_id in other tables

ALTER TABLE anime_keyword
ALTER COLUMN keyword_id TYPE VARCHAR(10);

-- Adding foreign key CONSTRAINT for keyword_id in each table

ALTER TABLE anime_keyword
ADD CONSTRAINT fk_anime_keyword_keyword_id
FOREIGN KEY (keyword_id) REFERENCES keyword(keyword_id);


-- updating the studio_id in ST0000X format


-- Changing the data type of studio_id in studio table to VARCHAR(10)
ALTER TABLE studio
ALTER COLUMN studio_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized studio_id in studio table
CREATE OR REPLACE FUNCTION set_serialized_studio_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.studio_id := 'ST' || LPAD(NEW.studio_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_studio
BEFORE INSERT ON studio
FOR EACH ROW EXECUTE FUNCTION set_serialized_studio_id();

-- Adding foreign key constraints for studio_id in other tables

ALTER TABLE anime_studio
ALTER COLUMN studio_id TYPE VARCHAR(10);

-- Adding foreign key CONSTRAINT for studio_id in each table

ALTER TABLE anime_studio
ADD CONSTRAINT fk_anime_studio_studio_id
FOREIGN KEY (studio_id) REFERENCES studio(studio_id);

-- altering the character_id in CH0000X format

-- Changing the data type of character_id in character table to VARCHAR(10)
ALTER TABLE character
ALTER COLUMN character_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized character_id in character table
CREATE OR REPLACE FUNCTION set_serialized_character_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.character_id := 'CH' || LPAD(NEW.character_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_character
BEFORE INSERT ON character
FOR EACH ROW EXECUTE FUNCTION set_serialized_character_id();

-- Adding foreign key constraints for character_id in other tables

ALTER TABLE character_voice_actor
ALTER COLUMN character_id TYPE VARCHAR(10);

-- Adding foreign key CONSTRAINT for character_id in each table

ALTER TABLE character_voice_actor
ADD CONSTRAINT fk_character_voice_actor_character_id
FOREIGN KEY (character_id) REFERENCES character(character_id);


-- altering comment id in CM000X format


-- Changing the data type of comment_id in comment table to VARCHAR(10)
ALTER TABLE comment
ALTER COLUMN comment_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized comment_id in comment table
CREATE OR REPLACE FUNCTION set_serialized_comment_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.comment_id := 'CM' || LPAD(NEW.comment_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_comment
BEFORE INSERT ON comment
FOR EACH ROW EXECUTE FUNCTION set_serialized_comment_id();

-- Adding foreign key constraints for comment_id in other tables

ALTER TABLE reply
ALTER COLUMN comment_id TYPE VARCHAR(10);

-- Adding foreign key CONSTRAINT for comment_id in each table

ALTER TABLE reply
ADD CONSTRAINT fk_reply_comment_id
FOREIGN KEY (comment_id) REFERENCES comment(comment_id);


-- altering the episode id in EP0000X format


-- Changing the data type of episode_id in episode table to VARCHAR(10)
ALTER TABLE episode
ALTER COLUMN episode_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized episode_id in episode table
CREATE OR REPLACE FUNCTION set_serialized_episode_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.episode_id := 'EP' || LPAD(NEW.episode_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_episode
BEFORE INSERT ON episode
FOR EACH ROW EXECUTE FUNCTION set_serialized_episode_id();

-- Adding foreign key constraints for episode_id in other tables

ALTER TABLE comment
ALTER COLUMN episode_id TYPE VARCHAR(10);

ALTER TABLE comment
ADD CONSTRAINT fk_comment_episode_id
FOREIGN KEY (episode_id) REFERENCES episode(episode_id);



-- altering the image id in IM00X format

-- Changing the data type of id in images table to VARCHAR(10)
ALTER TABLE images
ALTER COLUMN id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized image_id in images table
CREATE OR REPLACE FUNCTION set_serialized_image_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := 'IM' || LPAD(NEW.id::TEXT, 8, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_image
BEFORE INSERT ON images
FOR EACH ROW EXECUTE FUNCTION set_serialized_image_id();

-- Adding image_id column to user_table and foreign key constraint
ALTER TABLE user_table
ADD COLUMN image_id TYPE VARCHAR(10);

ALTER TABLE user_table
ADD CONSTRAINT fk_user_table_image_id
FOREIGN KEY (image_id) REFERENCES images(id);


-- altering rating_id in the RT00000X format


-- Changing the data type of rating_id in rating table to VARCHAR(10)
ALTER TABLE rating
ALTER COLUMN rating_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized rating_id in rating table
CREATE OR REPLACE FUNCTION set_serialized_rating_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.rating_id := 'RT' || LPAD(NEW.rating_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_rating
BEFORE INSERT ON rating
FOR EACH ROW EXECUTE FUNCTION set_serialized_rating_id();


-- altering the reply id in RP00000X format


-- Changing the data type of reply_id in reply table to VARCHAR(10)
ALTER TABLE reply
ALTER COLUMN reply_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized reply_id in reply table
CREATE OR REPLACE FUNCTION set_serialized_reply_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reply_id := 'RP' || LPAD(NEW.reply_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_reply
BEFORE INSERT ON reply
FOR EACH ROW EXECUTE FUNCTION set_serialized_reply_id();


-- altering the review id in that format


-- Changing the data type of review_id in review table to VARCHAR(10)
ALTER TABLE review
ALTER COLUMN review_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized review_id in review table
CREATE OR REPLACE FUNCTION set_serialized_review_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.review_id := 'RV' || LPAD(NEW.review_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_review
BEFORE INSERT ON review
FOR EACH ROW EXECUTE FUNCTION set_serialized_review_id();


-- altering season id in SN00000X format

-- Changing the data type of season_id in season table to VARCHAR(10)
ALTER TABLE season
ALTER COLUMN season_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized season_id in season table
CREATE OR REPLACE FUNCTION set_serialized_season_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.season_id := 'SN' || LPAD(NEW.season_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_season
BEFORE INSERT ON season
FOR EACH ROW EXECUTE FUNCTION set_serialized_season_id();


ALTER TABLE comment
ALTER COLUMN season_id TYPE VARCHAR(10);

ALTER TABLE comment
ADD CONSTRAINT fk_comment_season_id
FOREIGN KEY (season_id) REFERENCES season(season_id);

ALTER TABLE user_watchlist
ALTER COLUMN season_id TYPE VARCHAR(10);

ALTER TABLE comment
ADD CONSTRAINT fk_user_watchlist_season_id
FOREIGN KEY (season_id) REFERENCES season(season_id);

ALTER TABLE episode
ALTER COLUMN season_id TYPE VARCHAR(10);

ALTER TABLE episode
ADD CONSTRAINT fk_episode_season_id
FOREIGN KEY (season_id) REFERENCES season(season_id);


-- altering track_id in TR0000X format

-- Changing the data type of track_id in soundtrack table to VARCHAR(10)
ALTER TABLE soundtrack
ALTER COLUMN track_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized track_id in soundtrack table
CREATE OR REPLACE FUNCTION set_serialized_track_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.track_id := 'TR' || LPAD(NEW.track_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_soundtrack
BEFORE INSERT ON soundtrack
FOR EACH ROW EXECUTE FUNCTION set_serialized_track_id();


-- altering trailer_id in TL0000X format

-- Changing the data type of trailer_id in trailer table to VARCHAR(10)
ALTER TABLE trailer
ALTER COLUMN trailer_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized trailer_id in trailer table
CREATE OR REPLACE FUNCTION set_serialized_trailer_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trailer_id := 'TL' || LPAD(NEW.trailer_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_trailer
BEFORE INSERT ON trailer
FOR EACH ROW EXECUTE FUNCTION set_serialized_trailer_id();


-- altering va_id in VA0000X format


-- Changing the data type of va_id in voice_actor table to VARCHAR(10)
ALTER TABLE voice_actor
ALTER COLUMN va_id TYPE VARCHAR(10);

-- Adding trigger and function for setting serialized va_id in voice_actor table
CREATE OR REPLACE FUNCTION set_serialized_va_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.va_id := 'VA' || LPAD(NEW.va_id::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_voice_actor
BEFORE INSERT ON voice_actor
FOR EACH ROW EXECUTE FUNCTION set_serialized_va_id();


ALTER TABLE character_voice_actor
ALTER COLUMN va_id TYPE VARCHAR(10);

ALTER TABLE character_voice_actor
ADD CONSTRAINT fk_character_voice_actor_va_id
FOREIGN KEY (va_id) REFERENCES voice_actor(va_id);


-- adding some extra fields to anime_table

ALTER TABLE anime_table
ADD COLUMN title_japanese VARCHAR(255),
ADD COLUMN title_synonyms VARCHAR[],
ADD COLUMN episode_no INTEGER;


-- adding the new season table making it work as a junction table

CREATE TABLE season (
    base_anime_id VARCHAR(10),
    related_anime_id VARCHAR(10),
    relation_type VARCHAR(50),
    PRIMARY KEY (base_anime_id, related_anime_id),
    FOREIGN KEY (base_anime_id) REFERENCES anime_table(anime_id),
    FOREIGN KEY (related_anime_id) REFERENCES anime_table(anime_id)
);


ALTER TABLE anime_table
ADD COLUMN base_anime_id VARCHAR(10) REFERENCES anime_table(anime_id);

ALTER TABLE genre
ADD CONSTRAINT unique_genre_name UNIQUE (genre_name);


ALTER TABLE keyword
ADD CONSTRAINT unique_keyword_name UNIQUE (keyword_name);


ALTER TABLE voice_actor
ADD CONSTRAINT unique_va_name UNIQUE (name);


ALTER TABLE studio
ADD CONSTRAINT unique_studio_name UNIQUE (studio_name);

ALTER TABLE trailer
ADD CONSTRAINT unique_url UNIQUE (video_url);

ALTER TABLE voice_actor
ADD CONSTRAINT unique_name UNIQUE (name);


ALTER TABLE character_voice_actor
ADD CONSTRAINT unique_character_va_id UNIQUE (character_id, va_id);


-- updated the triggers

CREATE OR REPLACE FUNCTION set_serialized_anime_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.anime_id := 'A' || LPAD(NEW.anime_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := 'U' || LPAD(NEW.user_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_genre_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.genre_id := 'G' || LPAD(NEW.genre_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_keyword_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.keyword_id := 'K' || LPAD(NEW.keyword_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_studio_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.studio_id := 'ST' || LPAD(NEW.studio_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_character_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.character_id := 'CH' || LPAD(NEW.character_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_comment_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.comment_id := 'CM' || LPAD(NEW.comment_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_episode_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.episode_id := 'EP' || LPAD(NEW.episode_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_image_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.id := 'IM' || LPAD(NEW.id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_rating_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.rating_id := 'RT' || LPAD(NEW.rating_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_reply_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reply_id := 'RP' || LPAD(NEW.reply_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_review_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.review_id := 'RV' || LPAD(NEW.review_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_season_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.season_id := 'SN' || LPAD(NEW.season_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_track_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.track_id := 'TR' || LPAD(NEW.track_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_trailer_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trailer_id := 'TL' || LPAD(NEW.trailer_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION set_serialized_va_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.va_id := 'VA' || LPAD(NEW.va_id::TEXT, 12, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- updated the trigger

CREATE OR REPLACE FUNCTION update_anime_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE anime_table
        SET favorites = favorites + 1
        WHERE anime_id = NEW.anime_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE anime_table
        SET favorites = favorites - 1
        WHERE anime_id = OLD.anime_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anime_favorites_count_trigger
AFTER INSERT OR DELETE ON user_favorite_anime_list
FOR EACH ROW
EXECUTE FUNCTION update_anime_favorites_count();


-- added a user interaction table


CREATE TABLE user_anime_interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    anime_id VARCHAR(30) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- e.g., 'view', 'like', 'comment', etc.
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Add any additional columns you may need, such as interaction duration, etc.
    FOREIGN KEY (user_id) REFERENCES user_table(user_id),
    FOREIGN KEY (anime_id) REFERENCES anime_table(anime_id)
);


CREATE OR REPLACE FUNCTION set_serialized_interaction_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.interaction_id := 'IN' || LPAD(NEW.interaction_id::TEXT, 25, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER before_insert_interaction
BEFORE INSERT ON user_anime_interactions
FOR EACH ROW EXECUTE FUNCTION set_serialized_interaction_id();



CREATE TABLE vote_comment (
    vote_id SERIAL PRIMARY KEY,
    user_id VARCHAR(30) REFERENCES user_table(user_id),
    comment_id VARCHAR(30) REFERENCES comment(comment_id),
    anime_id VARCHAR(30) REFERENCES anime_table(anime_id),
		vote_type VARCHAR(10) NOT NULL
);


CREATE OR REPLACE FUNCTION set_serialized_vote_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vote_id := 'VT' || LPAD(NEW.vote_id::TEXT, 15, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_vote_id
BEFORE INSERT ON vote_comment
FOR EACH ROW EXECUTE FUNCTION set_serialized_vote_id();



CREATE TABLE vote_reply (
    vote_id SERIAL PRIMARY KEY,
    user_id VARCHAR(30) REFERENCES user_table(user_id),
    reply_id VARCHAR(30),
    comment_id VARCHAR(30),
		vote_type VARCHAR(10)
);


CREATE OR REPLACE FUNCTION set_serialized_reply_vote_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vote_id := 'RV' || LPAD(NEW.vote_id::TEXT, 15, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_reply_vote_id
BEFORE INSERT ON vote_reply
FOR EACH ROW EXECUTE FUNCTION set_serialized_reply_vote_id();

CREATE TABLE vote_review (
    vote_id SERIAL PRIMARY KEY,
    user_id VARCHAR(30) REFERENCES user_table(user_id),
    anime_id VARCHAR(30),
    review_id VARCHAR(30),
		vote_type VARCHAR(10)
);


CREATE OR REPLACE FUNCTION set_serialized_review_vote_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vote_id := 'RVV' || LPAD(NEW.vote_id::TEXT, 15, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_review_vote_id
BEFORE INSERT ON vote_review
FOR EACH ROW EXECUTE FUNCTION set_serialized_review_vote_id();



CREATE TABLE PasswordChangeLog (
    change_id SERIAL PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		old_password_hash VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user_table(user_id)
);


CREATE OR REPLACE FUNCTION set_serialized_change_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.change_id := 'CNP' || LPAD(NEW.vote_id::TEXT, 15, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_password_change_id
BEFORE INSERT ON passwordchangelog
FOR EACH ROW EXECUTE FUNCTION set_serialized_change_id();


CREATE OR REPLACE FUNCTION log_password_change()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO PasswordChangeLog(user_id, old_password_hash) VALUES (NEW.user_id, OLD.password);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_table
CREATE TRIGGER password_change_after
AFTER UPDATE OF password ON user_table
FOR EACH ROW
WHEN (OLD.password IS DISTINCT FROM NEW.password)
EXECUTE PROCEDURE log_password_change();


CREATE OR REPLACE FUNCTION is_password_acceptable(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Check minimum and maximum length
    IF LENGTH(password) < 8 OR LENGTH(password) > 64 THEN
        RETURN 'Password must be between 8 and 64 characters.';
    END IF;
    
    -- Check for at least one uppercase letter
    IF NOT (password ~ '[A-Z]') THEN
        RETURN 'Password must contain at least one uppercase letter.';
    END IF;
    
    -- Check for at least one lowercase letter
    IF NOT (password ~ '[a-z]') THEN
        RETURN 'Password must contain at least one lowercase letter.';
    END IF;
    
    -- Check for at least one digit
    IF NOT (password ~ '[0-9]') THEN
        RETURN 'Password must contain at least one digit.';
    END IF;
    
    -- Check for at least one special character
    IF NOT (password ~ '[!@#$%^&*()-_=+{}|;:''",.<>/?`~]') THEN
        RETURN 'Password must contain at least one special character.';
    END IF;
    
    -- Convert password to uppercase and check against an extended list of common passwords
    IF UPPER(password) = ANY(ARRAY[
        'PASSWORD', '12345678', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM', 
        'ABCD1234', 'ABCDEFGH', 'LETMEIN', 'PASSWORD1', '123456789',
        'QWERTY123', '1Q2W3E4R', 'ADMIN', '123321', '666666', 
        '1QAZ2WSX', '1234QWER', 'AA123456', 'QWERTY', '12345', 
        '1234567890', '123123', '000000', 'ILOVEYOU', 'PASSWORD2', 
        '1234567', 'SUNSHINE', 'PRINCESS', 'ADMIN123', 'WELCOME'
    ]) THEN
        RETURN 'Password is too common.';
    END IF;
    
    -- Check for repeated characters (e.g., more than 3 repeated characters)
    IF (password ~ '(.)\1{2,}') THEN
        RETURN 'Password must not contain more than three repeated characters in a row.';
    END IF;
    
    -- Passed all checks
    RETURN 'Password is acceptable.';
END;
$$ LANGUAGE plpgsql;



CREATE TABLE user_genre_preference (
    user_id VARCHAR(30) NOT NULL,
    genre_id VARCHAR(30) NOT NULL,
    PRIMARY KEY (user_id, genre_id),
    FOREIGN KEY (user_id) REFERENCES user_table (user_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genre (genre_id) ON DELETE CASCADE
);



CREATE OR REPLACE FUNCTION update_user_genre_preference()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_genre_preference(user_id, genre_id)
    SELECT DISTINCT NEW.user_id, ag.genre_id
    FROM anime_genre ag
    WHERE ag.anime_id = NEW.anime_id
    ON CONFLICT (user_id, genre_id) DO NOTHING; -- Avoid duplicates
    
    RETURN NEW; -- Trigger functions should return a row or NULL
END;
$$ LANGUAGE plpgsql;



CREATE TRIGGER update_genre_preferences_after_favoriting
AFTER INSERT ON user_favorite_anime_list
FOR EACH ROW
EXECUTE FUNCTION update_user_genre_preference();



CREATE OR REPLACE PROCEDURE insert_user_interaction(
    p_user_id VARCHAR(30),
    p_anime_id VARCHAR(30),
    p_interaction_type VARCHAR(50)
)
LANGUAGE plpgsql -- Use plpgsql for procedural logic in PostgreSQL
AS $$
DECLARE
    v_total_interactions INTEGER; -- Specifying the data type as INTEGER
BEGIN
    -- Insert new interaction
    INSERT INTO user_anime_interactions (user_id, anime_id, interaction_type, interaction_date)
    VALUES (p_user_id, p_anime_id, p_interaction_type, CURRENT_TIMESTAMP);

    -- Calculate total interactions for the user
    SELECT COUNT(*) INTO v_total_interactions
    FROM user_anime_interactions
    WHERE user_id = p_user_id;

    -- Update user_total_interaction table
    UPDATE user_table
    SET total_interactions = v_total_interactions
    WHERE user_id = p_user_id;
END;
$$;


-- Alter comment table constraint
ALTER TABLE "comment" DROP CONSTRAINT "fk_comment_user_id";
ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_user_id" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter forum_replies table constraint
ALTER TABLE "forum_replies" DROP CONSTRAINT "forum_replies_user_id_fkey";
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter forums table constraint for created_by_user_id
ALTER TABLE "forums" DROP CONSTRAINT "forums_created_by_user_id_fkey";
ALTER TABLE "forums" ADD CONSTRAINT "forums_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter rating table constraint
ALTER TABLE "rating" DROP CONSTRAINT "fk_rating_user_id";
ALTER TABLE "rating" ADD CONSTRAINT "fk_rating_user_id" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter reply table constraint
ALTER TABLE "reply" DROP CONSTRAINT "fk_reply_user_id";
ALTER TABLE "reply" ADD CONSTRAINT "fk_reply_user_id" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter review table constraint
ALTER TABLE "review" DROP CONSTRAINT "fk_review_user_id";
ALTER TABLE "review" ADD CONSTRAINT "fk_review_user_id" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter user_anime_interactions table constraint
ALTER TABLE "user_anime_interactions" DROP CONSTRAINT "user_anime_interactions_user_id_fkey";
ALTER TABLE "user_anime_interactions" ADD CONSTRAINT "user_anime_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter user_favorite_anime_list table constraint
ALTER TABLE "user_favorite_anime_list" DROP CONSTRAINT "fk_user_favorite_anime_list_user_id";
ALTER TABLE "user_favorite_anime_list" ADD CONSTRAINT "fk_user_favorite_anime_list_user_id" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter user_forum_interaction table constraint
ALTER TABLE "user_forum_interaction" DROP CONSTRAINT "user_forum_interaction_user_id_fkey";
ALTER TABLE "user_forum_interaction" ADD CONSTRAINT "user_forum_interaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter user_genre_preference table constraint
ALTER TABLE "user_genre_preference" DROP CONSTRAINT "user_genre_preference_user_id_fkey";
ALTER TABLE "user_genre_preference" ADD CONSTRAINT "user_genre_preference_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter user_login_logout table constraint
ALTER TABLE "user_login_logout" DROP CONSTRAINT "user_login_logout_user_id_fkey";
ALTER TABLE "user_login_logout" ADD CONSTRAINT "user_login_logout_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter user_watchlist table constraint
ALTER TABLE "user_watchlist" DROP CONSTRAINT "fk_user_watchlist_user_id";
ALTER TABLE "user_watchlist" ADD CONSTRAINT "fk_user_watchlist_user_id" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter vote_comment table constraint
ALTER TABLE "vote_comment" DROP CONSTRAINT "vote_comment_user_id_fkey";
ALTER TABLE "vote_comment" ADD CONSTRAINT "vote_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter vote_forum_reply table constraint
ALTER TABLE "vote_forum_reply" DROP CONSTRAINT "vote_forum_reply_user_id_fkey";
ALTER TABLE "vote_forum_reply" ADD CONSTRAINT "vote_forum_reply_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter vote_reply table constraint
ALTER TABLE "vote_reply" DROP CONSTRAINT "vote_reply_user_id_fkey";
ALTER TABLE "vote_reply" ADD CONSTRAINT "vote_reply_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;

-- Alter vote_review table constraint
ALTER TABLE "vote_review" DROP CONSTRAINT "vote_review_user_id_fkey";
ALTER TABLE "vote_review" ADD CONSTRAINT "vote_review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_table" ("user_id") ON DELETE CASCADE;







-- for necessisty

ALTER SEQUENCE public.anime_table_anime_id_seq RESTART WITH 1;

ALTER SEQUENCE public.character_character_id_seq RESTART WITH 1;

ALTER SEQUENCE public.episode_episode_id_seq RESTART WITH 1;


ALTER SEQUENCE public.genre_genre_id_seq RESTART WITH 1;


ALTER SEQUENCE public.keyword_keyword_id_seq RESTART WITH 1;

ALTER SEQUENCE public.studio_studio_id_seq RESTART WITH 1;

ALTER SEQUENCE public.trailer_trailer_id_seq RESTART WITH 1;

ALTER SEQUENCE public.user_table_user_id_seq RESTART WITH 1;

ALTER SEQUENCE public.voice_actor_va_id_seq RESTART WITH 1;

ALTER SEQUENCE public.user_anime_interactions_interaction_id_seq RESTART WITH 1;