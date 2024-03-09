const express = require('express')
const pool = require('./db')
const bcrypt = require('bcrypt')
const multer = require('multer')
const cors = require('cors')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { count } = require('console')
const app = express()

const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'anihub21.22@gmail.com',
        pass: 'ylbu ledq nzre qbuf',
    },
});

async function sendPasswordResetEmail(email, token) {
    const mailOptions = {
        from: 'anihub21.22@gmail.com',
        to: email,
        subject: 'Password Reset - AniHub',
        html: `<p><strong>Use this token to enter your profile:</strong> <br/><br/>${token}
                <br/><br/><strong>It's only available for 1hr<br/>Don't share this with anyone</strong>
        </p>`
    }

    await transporter.sendMail(mailOptions);
}

app.post('/login', async (req, res) => {
    try {
        /* console.log(req.body); */
        const { email_username, password } = req.body;
        const result = await pool.query(
            'SELECT * FROM user_table u LEFT JOIN images i ON u.image_id = i.id WHERE (email = $1 OR username = $1)',
            [email_username]
        );

        /* console.log(result.rows[0]); */

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const isPasswordMatch = await bcrypt.compare(password, user.password);

            if (isPasswordMatch) {
                if (new Date(result.rows[0].ban_until) > new Date()) {
                    res.status(401).json({
                        success: false,
                        message: 'Your account is banned until ' + result.rows[0].ban_until
                    })
                } else {
                    const vacation = await pool.query(
                        `UPDATE user_table SET onvacation = FALSE WHERE user_id = $1`, [user.user_id]
                    )

                    const login = await pool.query(
                        `INSERT INTO user_login_logout (user_id, event_type)
                            VALUES ($1, $2) RETURNING *`,
                        [user.user_id, "Login"]
                    )

                    res.status(200).json({
                        success: true,
                        user: user
                    })
                }
            }
            else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid Password'
                })
            }
        }
        else {
            res.status(401).json({
                success: false,
                message: 'No such user exists'
            });
        }
    }
    catch (error) {
        console.error('Error during login: ', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
})

app.post('/user/logOut', async (req, res) => {
    try {
        const { userID } = req.body;

        console.log(userID)

        const result = await pool.query(
            `INSERT INTO user_login_logout (user_id, event_type)
                    VALUES ($1, $2) RETURNING *`,
            [userID, "Logout"]
        )

        if (result.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            })
        } else {
            res.status(404).json({
                success: false,
                message: 'Failed to log out'
            })
        }
    } catch (error) {
        console.error('Error during logout: ', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
})

app.post('/login/forgot-password-req', async (req, res) => {
    try {
        const { email } = req.body;

        const userResult = await pool.query(
            'SELECT * FROM user_table WHERE email = $1',
            [email]
        )

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        const user = userResult.rows[0]

        const resetToken = crypto.randomBytes(32).toString('hex');

        const expirationDate = new Date(Date.now() + 3600000)

        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expiration_date) VALUES ($1, $2, $3)',
            [user.user_id, resetToken, expirationDate]
        )

        await sendPasswordResetEmail(email, resetToken)

        /* console.log('Sent'); */

        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        })
    } catch (error) {
        console.error('Error during password reset request: ', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server error'
        })
    }
})

app.post('/login/rest-password', async (req, res) => {
    try {
        const { username, token, newPassword } = req.body;

        const tokenResult = await pool.query(
            'SELECT * FROM user_table u LEFT JOIN password_reset_tokens pt ON u.user_id = pt.user_id WHERE token = $1 AND username = $2 AND expiration_date > $3',
            [token, username, new Date()]
        )

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            })
        }

        const user = await pool.query(
            'SELECT * FROM user_table WHERE username = $1',
            [username]
        )

        if (user.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        const passwordAcceptableResult = await pool.query(
            'SELECT is_password_acceptable($1) AS password_check',
            [newPassword]
        );

        if (passwordAcceptableResult.rows[0].password_check !== 'Password is acceptable.') {
            return res.status(400).json({
                success: false,
                message: passwordAcceptableResult.rows[0].password_check
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user_id = user.rows[0].user_id;


        const checkOldPasswords = await pool.query(
            'SELECT old_password_hash FROM passwordchangelog WHERE user_id = $1 ORDER BY change_timestamp DESC LIMIT 5',
            [user_id]
        );

        const passwordReuse = await Promise.all(checkOldPasswords.rows.map(row =>
            bcrypt.compare(newPassword, row.old_password_hash)
        ));

        if (passwordReuse.includes(true)) {
            return res.status(200).json({
                success: false,
                message: 'New password cannot be the same as any old passwords.'
            });
        }


        await pool.query(
            'UPDATE user_table SET password = $1 WHERE user_id = $2',
            [hashedPassword, user.rows[0].user_id]
        )

        await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token])

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        })
    } catch (error) {
        console.error('Error during password reset', error)
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
})

app.post('/register', async (req, res) => {
    try {
        const { email, username, first_name, last_name, password, confirm_password, agree_terms } = req.body;

        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email'
            })
        }

        if (!username || username.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 4 characters'
            })
        }

        if (!first_name) {
            return res.status(400).json({
                success: false,
                message: 'First name must required'
            })
        }

        const passwordAcceptableResult = await pool.query(
            'SELECT is_password_acceptable($1) AS password_check',
            [password]
        );

        // If the password is not acceptable, return an error message
        if (passwordAcceptableResult.rows[0].password_check !== 'Password is acceptable.') {
            return res.status(400).json({
                success: false,
                message: passwordAcceptableResult.rows[0].password_check
            });
        }

        if (password !== confirm_password) {
            /* console.log(password, confirm_password) */
            return res.status(400).json({
                success: false,
                message: "Password don't match"
            })
        }

        if (!agree_terms) {
            return res.status(400).json({
                success: false,
                message: "Please agree to the terms and conditions"
            })
        }

        const userExists = await pool.query(
            'SELECT * FROM user_table WHERE email = $1 OR username = $2',
            [email, username]
        )
        if (userExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const result = await pool.query(
            'INSERT INTO user_table ("reg_date", "email", "password", "username", "first_name", "second_name", "type") VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5, $6) RETURNING *',
            [email, hashedPassword, username, first_name, last_name, "Member"],
        )

        res.status(200).json({
            success: true,
            user: result.rows[0]
        })
    } catch (error) {
        console.error('Error during registration: ' + error)
        res.status(500).json({
            error: 'Internal Server error'
        })
    }
})

app.post('/profile/update', async (req, res) => {
    try {
        const { first_name, last_name, display_name, user_id } = req.body;

        const result = await pool.query(
            'UPDATE user_table SET first_name = $1, second_name = $2, display_name = $3 WHERE user_id = $4 RETURNING *',
            [first_name, last_name, display_name, user_id]
        )

        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            res.status(200).json({
                success: true,
                user: updatedUser
            })
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Profile update failed'
            })
        }
    } catch (error) {
        console.error('Error updating profile: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
})

app.post('/profile/change-pass', async (req, res) => {
    try {
        const { user_id, new_password, confirmPassword } = req.body;

        const passwordAcceptableResult = await pool.query(
            'SELECT is_password_acceptable($1) AS password_check',
            [new_password]
        );

        // If the password is not acceptable, return an error message
        if (passwordAcceptableResult.rows[0].password_check !== 'Password is acceptable.') {
            return res.status(400).json({
                success: false,
                message: passwordAcceptableResult.rows[0].password_check
            });
        }


        if (new_password !== confirmPassword) {
            res.status(400).json({
                success: false,
                message: "Password don't match"
            })
        }

        const hashedPassword = await bcrypt.hash(new_password, 10)

        const checkOldPasswords = await pool.query(
            'SELECT old_password_hash FROM passwordchangelog WHERE user_id = $1 ORDER BY change_timestamp DESC LIMIT 5',
            [user_id]
        );

        const passwordReuse = await Promise.all(checkOldPasswords.rows.map(row =>
            bcrypt.compare(new_password, row.old_password_hash)
        ));

        if (passwordReuse.includes(true)) {
            return res.status(400).json({
                success: false,
                message: 'New password cannot be the same as any old passwords.'
            });
        }

        const result = await pool.query(
            'UPDATE user_table SET password = $1 WHERE user_id = $2 RETURNING *',
            [hashedPassword, user_id]
        )

        if (result.rows.length > 0) {
            const updatedUser = result.rows[0]
            res.status(200).json({
                success: true,
                user: updatedUser
            })
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Changing password failed'
            })
        }
    }
    catch (error) {
        console.error('Error changing password: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
})

/* app.post('/profile/upload-avatar/:user_id', upload.single('avatar'), async (req, res) => {
    try {

        const userId = req.params.user_id;
        const imageBuffer = req.file.buffer;

        await pool.query(
            'UPDATE user_table SET profile_picture = $1 WHERE user_id = $2',
            [avatarData, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
        });
    } catch (error) {
        console.error('Error during avatar upload: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
}); */

app.get('/profile/select-avatar', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT  * FROM images'
        )

        res.status(200).json(result.rows)
    } catch (error) {
        console.error('Error during fetching avatar to select from');
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching images'
        });
    }
});

app.post('/profile/set-avatar', async (req, res) => {
    try {
        const { user_id, image_id, image_url, image_alt_text } = req.body;
        const user = await pool.query('SELECT * FROM user_table WHERE user_id = $1', [user_id])
        console.log(user.rows[0]);
        if (!user.rows[0]) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        const result = await pool.query('UPDATE user_table SET image_id = $1 WHERE user_id = $2 RETURNING *', [image_id, user_id]);
        if (result.rows.length > 0) {
            const updatedUser = result.rows[0];
            res.status(200).json({
                success: true,
                user: updatedUser
            })
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Profile update failed'
            })
        }
    }
    catch (error) {
        console.error("An error occurred while updating the avatar ", error.message);
    }
})

app.get('/home/getFeaturedAnime', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM anime_table WHERE favorites IS NOT NULL AND average_rating is NOT NULL ORDER BY favorites DESC, average_rating DESC LIMIT 12'
        )
        const featuredAnime = result.rows;
        /* console.log(result.rows[0]) */
        res.json(featuredAnime)
    }
    catch (err) {
        console.error('Error fetching featured anime: ', err.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
})

app.get('/home/getNewRelease', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
                FROM anime_table
                WHERE (release_date IS NOT NULL
                AND release_date < TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')) AND rated <> 'Rx - Hentai'
                ORDER BY release_date DESC, average_rating DESC, favorites DESC
                LIMIT 5`
        )
        const newRelease = result.rows;
        if (newRelease.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No new release anime found'
            })
        }
        res.json(newRelease)
    } catch (error) {
        console.error('Error fetching new release anime: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/home/getUpcoming', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
                FROM anime_table
                WHERE (release_date IS NULL OR release_date > TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')) AND rated <> 'Rx - Hentai'
                ORDER BY release_date DESC, average_rating DESC, favorites DESC 
                LIMIT 5`
        )
        const newRelease = result.rows;
        if (newRelease.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No new release anime found'
            })
        }
        res.json(newRelease)
    } catch (error) {
        console.error('Error fetching new release anime: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/home/getNewAdded', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
                FROM anime_table
                WHERE rated <> 'Rx - Hentai'
                ORDER BY added_date DESC, average_rating DESC, favorites DESC 
                LIMIT 5`
        )
        const newRelease = result.rows;
        if (newRelease.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No new release anime found'
            })
        }
        res.json(newRelease)
    } catch (error) {
        console.error('Error fetching new release anime: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get(`/home/recommendations/:user_id`, async (req, res) => {
    try {
        const user_id = req.params.user_id;

        const result = await pool.query(
            `SELECT
                a.*,
                calculate_anime_recommendation_score($1, a.anime_id) AS recommendation_score
            FROM
                anime_table a
            LEFT JOIN
                user_watchlist uw ON a.anime_id = uw.anime_id AND uw.user_id = $1
            WHERE
                uw.anime_id IS NULL
            ORDER BY
                recommendation_score DESC, favorites DESC
            LIMIT 12;`, [user_id]
        )

        if (result.rows.length > 0) {
            res.json(result.rows)
        } else {
            res.status(404).json({
                success: false,
                message: 'No recommendations found'
            })
        }
    } catch (error) {
        console.error('Error fetching recommendations: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/browse/trendingAnime', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, COUNT(uai.interaction_id) AS interactions
                FROM anime_table a
                LEFT JOIN user_anime_interactions uai ON a.anime_id = uai.anime_id
                WHERE uai.interaction_date >= CURRENT_TIMESTAMP - INTERVAL '1 month' AND uai.interaction_date <= CURRENT_TIMESTAMP
                GROUP BY a.anime_id
                HAVING AVG(a.average_rating) >= 7
                ORDER BY COUNT(uai.interaction_id) DESC
                LIMIT 12`
        )

        const trendingAnime = result.rows;
        /* console.log(trendingAnime.length) */
        res.json(trendingAnime);
    } catch (error) {
        console.error('Error fetching trending anime: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/browse/popularAnime', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
                FROM anime_table
                WHERE
                    CASE
                        WHEN EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN 1 AND 3 THEN airing_season = 'Winter ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
                        WHEN EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN 4 AND 6 THEN airing_season = 'Spring ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
                        WHEN EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN 7 AND 9 THEN airing_season = 'Summer ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
                        WHEN EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN 10 AND 12 THEN airing_season = 'Fall ' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
                        ELSE FALSE
                    END
                ORDER BY favorites DESC, average_rating DESC
                LIMIT 12`
        )
        const popularAnime = result.rows;
        /* console.log(result.rows.length) */
        res.json(popularAnime)
    } catch (error) {
        console.error('Error fetching popular anime: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
})

app.get('/browse/allAnime', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, array_agg(g.genre_name) AS genres
                FROM anime_table a
                LEFT JOIN anime_genre ag ON a.anime_id = ag.anime_id
                LEFT JOIN genre g ON ag.genre_id = g.genre_id
                GROUP BY a.anime_id
                HAVING average_rating >= 8.5
                ORDER BY favorites DESC
                LIMIT 30`
        )
        const allAnime = result.rows;
        res.json(allAnime)
    } catch (error) {
        console.error('Error fetching all anime: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/search-box/anime', async (req, res) => {
    try {
        const { searchText } = req.body;

        /* console.log(searchText); */

        const result = await pool.query(
            `SELECT a.*, array_agg(g.genre_name) AS genres
            FROM anime_table a
            LEFT JOIN anime_genre ag ON a.anime_id = ag.anime_id
            LEFT JOIN genre g ON ag.genre_id = g.genre_id
            WHERE a.title ILIKE $1 || '%'
            GROUP BY a.anime_id
            ORDER BY favorites DESC, average_rating DESC
            LIMIT 5`, [searchText]
        )

        /* console.log(result.rows); */

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching searched anime: ', err.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
})


app.get('/anime/:id', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            `SELECT
                anime.*,
                array_agg(genre.genre_name) AS genres,
                (
                    SELECT
                        COUNT(*) + 1
                    FROM
                        anime_table
                    WHERE
                        (favorites IS NOT NULL AND favorites > 0) AND
                        favorites > anime.favorites
                ) AS favorites_position,
                (
                    SELECT
                        COUNT(*) + 1
                    FROM
                        anime_table
                    WHERE
                        (average_rating IS NOT NULL AND average_rating > 0) AND
                        average_rating > anime.average_rating
                ) AS rating_position
            FROM
                anime_table AS anime
            LEFT JOIN
                anime_genre ON anime.anime_id = anime_genre.anime_id
            LEFT JOIN
                genre ON anime_genre.genre_id = genre.genre_id
            WHERE
                anime.anime_id = $1
            GROUP BY
                anime.anime_id`,
            [animeID]
        )

        if (result.rows.length > 0) {
            const animeDetails = result.rows[0];
            res.json(animeDetails);
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Anime not found',
            })
        }
    } catch (error) {
        console.error('Error fetching anime details: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:animeID/episodes', async (req, res) => {
    try {
        const animeID = req.params.animeID;

        const result = await pool.query(
            `SELECT * FROM episode WHERE anime_id = $1 ORDER BY episode_no ASC`,
            [animeID]
        )

        if (result.rows.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Anime episodes not found'
            })
        } else {
            res.status(200).json(result.rows)
        }

    } catch (error) {
        console.error('Error fetching anime episodes: ', error.message)
        /* res.status(500).json({
            success: false,
            message: 'Internal server error'
        }) */
    }
})

app.get('/anime/:id/keywords', async (req, res) => {
    try {
        const animeID = req.params.id;

        const result = await pool.query(
            `SELECT a.anime_id, array_agg(k.keyword_name) AS keywords
                FROM anime_table a
                LEFT JOIN anime_keyword ak ON a.anime_id = ak.anime_id
                LEFT JOIN keyword k ON ak.keyword_id = k.keyword_id
                WHERE a.anime_id = $1
                GROUP BY a.anime_id`,
            [animeID]
        )

        if (result.rows) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({
                success: false,
                message: 'Keywords not found',
            })
        }
    } catch (error) {
        console.error('Error fetching anime keywords: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/character-voice-actor', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            'SELECT c.character_id as character_id, va.va_id as va_id, c.name AS character_name, c.image AS character_image, va.name AS va_name, va.image AS va_image, va.language as va_language FROM character AS c LEFT JOIN character_voice_actor AS cva ON c.character_id = cva.character_id LEFT JOIN voice_actor AS va ON cva.va_id = va.va_id WHERE c.anime_id = $1',
            [animeID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows);
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Characters not found',
            })
        }
    } catch (error) {
        console.error('Error fetching character details: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/production', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            'SELECT * FROM anime_studio AS ans LEFT JOIN studio AS s ON ans.studio_id = s.studio_id WHERE ans.anime_id = $1',
            [animeID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows);
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Production data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching production details: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/trailer', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            'SELECT * FROM trailer WHERE anime_id = $1',
            [animeID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Trailer data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching trailer details: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/recommendations', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            `SELECT a.*, common_genre_count 
             FROM
                    (
                        SELECT
                            a.anime_id,
                            a.title,
                            COUNT(ag.genre_id) AS common_genre_count
                        FROM
                            anime_table a
                        JOIN
                            anime_genre ag ON a.anime_id = ag.anime_id
                        WHERE
                            a.anime_id <> $1
                            AND ag.genre_id IN (
                                SELECT
                                    genre_id
                                FROM
                                    anime_genre
                                WHERE
                                    anime_id = $1
                            )
                        GROUP BY
                            a.anime_id, a.title
                        ORDER BY
                            common_genre_count DESC,
                                        a.favorites DESC,
                                        a.average_rating DESC
                        LIMIT 12
                    ) top_12
                JOIN
                    anime_table a ON top_12.anime_id = a.anime_id`,
            [animeID]
        )
        if (result.rows.length > 0) {
            res.json(result.rows);
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Recommend anime data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching recommend anime details: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/related', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            `SELECT
                    a.*,
                    s.relation_type
                FROM
                    anime_table a
                JOIN
                    season s ON a.anime_id = s.related_anime_id
                WHERE
                    s.base_anime_id = $1`, [animeID]
        )
        if (result.rows.length > 0) {
            res.json(result.rows);
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Related anime data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching related anime details: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/statusSegment', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            `SELECT
                SUM(CASE WHEN status = 'Planning' THEN 1 ELSE 0 END) AS planning,
                SUM(CASE WHEN status = 'Watching' THEN 1 ELSE 0 END) AS watching,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'Dropped' THEN 1 ELSE 0 END) AS dropped,
                SUM(CASE WHEN status = 'Paused' THEN 1 ELSE 0 END) AS paused
            FROM user_watchlist
            where anime_id = $1`,
            [animeID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({
                success: false,
                message: 'Status segment data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching status segment data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/:id/statusSegment', async (req, res) => {
    try {
        const userID = req.params.id;
        const result = await pool.query(
            `SELECT
                SUM(CASE WHEN status = 'Planning' THEN 1 ELSE 0 END) AS planning,
                SUM(CASE WHEN status = 'Watching' THEN 1 ELSE 0 END) AS watching,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'Dropped' THEN 1 ELSE 0 END) AS dropped,
                SUM(CASE WHEN status = 'Paused' THEN 1 ELSE 0 END) AS paused
            FROM user_watchlist
            where user_id = $1`,
            [userID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({
                success: false,
                message: 'Status segment data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching status segment data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/anime/:id/scoreGraph', async (req, res) => {
    try {
        const animeID = req.params.id;
        const result = await pool.query(
            `SELECT anime_id,
                SUM(CASE WHEN rating_score = 1 THEN 1 ELSE 0 END) AS rating_1,
                SUM(CASE WHEN rating_score = 2 THEN 1 ELSE 0 END) AS rating_2,
                SUM(CASE WHEN rating_score = 3 THEN 1 ELSE 0 END) AS rating_3,
                SUM(CASE WHEN rating_score = 4 THEN 1 ELSE 0 END) AS rating_4,
                SUM(CASE WHEN rating_score = 5 THEN 1 ELSE 0 END) AS rating_5,
                SUM(CASE WHEN rating_score = 6 THEN 1 ELSE 0 END) AS rating_6,
                SUM(CASE WHEN rating_score = 7 THEN 1 ELSE 0 END) AS rating_7,
                SUM(CASE WHEN rating_score = 8 THEN 1 ELSE 0 END) AS rating_8,
                SUM(CASE WHEN rating_score = 9 THEN 1 ELSE 0 END) AS rating_9,
                SUM(CASE WHEN rating_score = 10 THEN 1 ELSE 0 END) AS rating_10
            FROM rating
            WHERE anime_id = $1
            GROUP BY anime_id`,
            [animeID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({
                success: false,
                message: 'Score ratings data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching score ratings data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/:id/scoreGraph', async (req, res) => {
    try {
        const userID = req.params.id;
        const result = await pool.query(
            `SELECT user_id,
                SUM(CASE WHEN rating_score = 1 THEN 1 ELSE 0 END) AS rating_1,
                SUM(CASE WHEN rating_score = 2 THEN 1 ELSE 0 END) AS rating_2,
                SUM(CASE WHEN rating_score = 3 THEN 1 ELSE 0 END) AS rating_3,
                SUM(CASE WHEN rating_score = 4 THEN 1 ELSE 0 END) AS rating_4,
                SUM(CASE WHEN rating_score = 5 THEN 1 ELSE 0 END) AS rating_5,
                SUM(CASE WHEN rating_score = 6 THEN 1 ELSE 0 END) AS rating_6,
                SUM(CASE WHEN rating_score = 7 THEN 1 ELSE 0 END) AS rating_7,
                SUM(CASE WHEN rating_score = 8 THEN 1 ELSE 0 END) AS rating_8,
                SUM(CASE WHEN rating_score = 9 THEN 1 ELSE 0 END) AS rating_9,
                SUM(CASE WHEN rating_score = 10 THEN 1 ELSE 0 END) AS rating_10
            FROM rating
            WHERE user_id = $1
            GROUP BY user_id`,
            [userID]
        )

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({
                success: false,
                message: 'Score ratings data not found',
            })
        }
    } catch (error) {
        console.error('Error fetching score ratings data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/rank_interaction', async (req, res) => {
    try {
        const animeID = req.params.id;

        const result = await pool.query(
            `WITH AnimeInteractionCounts AS (
                SELECT
                    a.anime_id,
                    COUNT(i.interaction_type) AS interaction_count
                FROM
                    anime_table a
                LEFT JOIN
                    user_anime_interactions i ON a.anime_id = i.anime_id
                GROUP BY
                    a.anime_id
            )
            , RankedAnime AS (
                SELECT
                    anime.anime_id,
                    aic.interaction_count,
                    ROW_NUMBER() OVER (ORDER BY aic.interaction_count DESC) AS interaction_rank
                FROM
                    anime_table anime
                LEFT JOIN
                    AnimeInteractionCounts aic ON anime.anime_id = aic.anime_id
            )
            SELECT
                RankedAnime.anime_id,
                RankedAnime.interaction_count,
                RankedAnime.interaction_rank
            FROM
                RankedAnime
            WHERE
                RankedAnime.anime_id = $1`, [animeID]
        )
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({
                success: false,
                message: 'Ranking data not found',
            })
        }

    } catch (error) {
        console.error('Error fetching anime ranking interaction data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/:id/interaction-per-day', async (req, res) => {
    try {
        const animeID = req.params.id;

        const result = await pool.query(
            `WITH date_series AS (
                SELECT date::date
                FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) AS date
                )
                SELECT
                ds.date AS interaction_date,
                COALESCE(COUNT(uai.anime_id), 0) AS interaction_count
                FROM
                date_series ds
                LEFT JOIN user_anime_interactions uai ON ds.date = DATE(uai.interaction_date)
                AND uai.anime_id = $1
                GROUP BY
                ds.date
                ORDER BY
                ds.date`, [animeID]
        )
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({
                success: false,
                message: 'Interaction data not found',
            })
        }

    } catch (error) {
        console.error('Error fetching anime interaction data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/:id/interaction-per-day', async (req, res) => {
    try {
        const userID = req.params.id;

        const result = await pool.query(
            `WITH date_series AS (
                SELECT date::date
                FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) AS date
                )
                SELECT
                ds.date AS interaction_date,
                COALESCE(COUNT(uai.user_id), 0) AS interaction_count
                FROM
                date_series ds
                LEFT JOIN user_anime_interactions uai ON ds.date = DATE(uai.interaction_date)
                AND uai.user_id = $1
                GROUP BY
                ds.date
                ORDER BY
                ds.date`, [userID]
        )
        if (result.rows.length > 0) {
            res.json(result.rows);
        } else {
            res.status(404).json({
                success: false,
                message: 'Interaction data not found',
            })
        }

    } catch (error) {
        console.error('Error fetching anime interaction data: ', error.message)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/anime/comment', async (req, res) => {
    try {
        const { userId, animeId, commentText } = req.body;

        const result = await pool.query(
            'INSERT INTO comment (user_id, anime_id, comment_text) VALUES ($1, $2, $3) RETURNING *',
            [userId, animeId, commentText]
        )

        const interactionData = await pool.query(
            `CALL insert_user_interaction($1, $2, $3)`,
            [userId, animeId, 'Comment added']
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to add comment',
            })
        }
    } catch (error) {
        console.error('Error adding comment: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/comments/:id', async (req, res) => {
    try {
        const animeID = req.params.id;

        const result = await pool.query(
            `SELECT
                c.anime_id, c.comment_date, c.comment_id, c.comment_text, c.episode_id, c.user_id,
                u.display_name, u.profile_picture, i.url, u.type AS user_type,
                COUNT(CASE WHEN vc.vote_type = 'upvote' THEN 1 END) AS upvote_count,
                COUNT(CASE WHEN vc.vote_type = 'downvote' THEN 1 END) AS downvote_count
            FROM
                comment c
            LEFT JOIN vote_comment vc ON c.comment_id = vc.comment_id
            LEFT JOIN user_table u ON c.user_id = u.user_id
            LEFT JOIN images i ON u.image_id = i.id
            WHERE
                c.anime_id = $1 AND u.onvacation <> TRUE
            GROUP BY
                c.comment_id, c.anime_id, c.comment_date, c.comment_text, c.episode_id, c.user_id, u.display_name, u.profile_picture, i.url, user_type
                ORDER BY upvote_count DESC`,
            [animeID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get comments',
            })
        }
    } catch (error) {
        console.error('Error getting comments: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/anime/comment/delete/:userId/:animeId/:commentId', async (req, res) => {
    try {
        const { userId, animeId, commentId } = req.params;

        const check = await pool.query(
            `SELECT * FROM comment WHERE anime_id = $1 AND comment_id = $2`,
            [animeId, commentId]
        )

        if (check.rows.length > 0) {
            const result = await pool.query(
                `DELETE FROM comment WHERE anime_id = $1 AND comment_id = $2`,
                [animeId, commentId]
            )

            const interactionData = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Comment deleted']
            )

            res.status(200).json({
                success: true,
                message: 'Comment deleted',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete comment',
            })
        }
    } catch (error) {
        console.error('Error deleting comment: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/anime/reply', async (req, res) => {
    try {
        const { userId, commentId, replyText } = req.body;

        const result = await pool.query(
            'INSERT INTO reply (user_id, reply_text, comment_id) VALUES ($1, $2, $3) RETURNING *',
            [userId, replyText, commentId]
        )

        const check = await pool.query(
            `SELECT user_id FROM comment WHERE comment_id = $1`, [commentId]
        )

        const notification = await pool.query(
            `INSERT INTO notifications (user_id, trigger_user_id, type, entity_type, entity_id)
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [check.rows[0].user_id, userId, "reply_comment", "comment", commentId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to add reply',
            })
        }
    } catch (error) {
        console.error('Error adding reply: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/comments/reply/:id', async (req, res) => {
    try {
        const commentID = req.params.id;

        const result = await pool.query(
            `SELECT
                r.reply_id, r.reply_date, r.comment_id, r.reply_text, r.user_id,
                u.display_name, u.profile_picture, i.url, u.type AS user_type,
                COUNT(CASE WHEN vr.vote_type = 'upvote' THEN 1 END) AS upvote_count,
                COUNT(CASE WHEN vr.vote_type = 'downvote' THEN 1 END) AS downvote_count
            FROM
                reply r
            LEFT JOIN vote_reply vr ON r.reply_id = vr.reply_id
            LEFT JOIN user_table u ON r.user_id = u.user_id
            LEFT JOIN images i ON i.id = u.image_id
            WHERE
                r.comment_id = $1 AND u.onvacation <> TRUE
            GROUP BY
                r.comment_id, r.reply_date, r.reply_text, r.reply_id, r.user_id, u.display_name, u.profile_picture, i.url, user_type
                ORDER BY upvote_count DESC`,
            [commentID]
        )

        /* console.log(result.rows.length) */

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get replies',
            })
        }
    } catch (error) {
        console.error('Error getting replies: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/comment/reply/delete/:userId/:commentId/:replyId', async (req, res) => {
    try {
        const { userId, commentId, replyId } = req.params;

        const check = await pool.query(
            `SELECT * FROM reply WHERE comment_id = $1 AND reply_id = $2`,
            [commentId, replyId]
        )

        if (check.rows.length > 0) {
            const result = await pool.query(
                `DELETE FROM reply WHERE comment_id = $1 AND reply_id = $2`,
                [commentId, replyId]
            )
            res.status(200).json({
                success: true,
                message: 'Reply deleted',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete reply',
            })
        }
    } catch (error) {
        console.error('Error deleting reply: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user/anime/vote-check/:userId/:animeId/:commentId', async (req, res) => {
    try {
        const { userId, animeId, commentId } = req.params;
        const result = await pool.query(
            'SELECT * FROM vote_comment WHERE user_id = $1 AND anime_id = $2 AND comment_id = $3',
            [userId, animeId, commentId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to check vote',
            })
        }
    } catch (error) {
        console.error('Error checking vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/anime/vote', async (req, res) => {
    try {
        const { userId, animeId, commentId, voteType } = req.body;

        const entityType = 'comment';
        let reverseVoteType;

        if (voteType === 'upvote') {
            reverseVoteType = 'downvote'
        } else {
            reverseVoteType = 'upvote'
        }

        const reverseCheck = await pool.query(
            `SELECT * FROM vote_comment WHERE user_id = $1 AND anime_id = $2 AND vote_type = $3 AND comment_id = $4`,
            [userId, animeId, reverseVoteType, commentId]
        )

        const mainCheck = await pool.query(
            `SELECT * FROM vote_comment WHERE user_id = $1 AND anime_id = $2 AND vote_type = $3 AND comment_id = $4`,
            [userId, animeId, voteType, commentId]
        )

        const result = await pool.query(
            `CALL handle_vote($1, $2, $3, $4, $5)`,
            [userId, commentId, entityType, voteType, animeId]
        );


        if (reverseCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Added vote'
            })
        } else if (mainCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Removed vote'
            })
        }

    } catch (error) {
        console.error('Error adding or removing vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})



app.post('/user/reply/vote', async (req, res) => {
    try {
        const { userId, replyId, commentId, voteType } = req.body;

        const entityType = 'reply';
        let reverseVoteType;

        if (voteType === 'upvote') {
            reverseVoteType = 'downvote';
        } else {
            reverseVoteType = 'upvote';
        }

        const reverseCheck = await pool.query(
            `SELECT * FROM vote_reply WHERE user_id = $1 AND reply_id = $2 AND vote_type = $3 AND comment_id = $4`,
            [userId, replyId, reverseVoteType, commentId]
        )

        const mainCheck = await pool.query(
            `SELECT * FROM vote_reply WHERE user_id = $1 AND reply_id = $2 AND vote_type = $3 AND comment_id = $4`,
            [userId, replyId, voteType, commentId]
        )

        const result = await pool.query(
            `CALL handle_vote($1, $2, $3, $4, $5)`,
            [userId, replyId, entityType, voteType, commentId]
        );

        if (reverseCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Added vote'
            })
        } else if (mainCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Removed vote'
            })
        }

    } catch (error) {
        console.error('Error adding or removing vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})



app.post('/user/forum-reply/vote', async (req, res) => {
    try {
        const { userId, forumId, replyId, voteType } = req.body;

        const entityType = 'forum_reply';
        let reverseVoteType;

        if (voteType === 'upvote') {
            reverseVoteType = 'downvote';
        } else {
            reverseVoteType = 'upvote';
        }

        const reverseCheck = await pool.query(
            `SELECT * FROM vote_forum_reply WHERE user_id = $1 AND forum_reply_id = $2 AND vote_type = $3 AND forum_id = $4`,
            [userId, replyId, reverseVoteType, forumId]
        )

        const mainCheck = await pool.query(
            `SELECT * FROM vote_forum_reply WHERE user_id = $1 AND forum_reply_id = $2 AND vote_type = $3 AND forum_id = $4`,
            [userId, replyId, voteType, forumId]
        )

        const result = await pool.query(
            `CALL handle_vote($1, $2, $3, $4, $5)`,
            [userId, replyId, entityType, voteType, forumId]
        );

        const voteCount = await pool.query(
            `CALL update_vote_counts_procedure($1)`,
            [replyId]
        )

        if (reverseCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Added vote'
            })
        } else if (mainCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Removed vote'
            })
        }
    } catch (error) {
        console.error('Error adding or removing vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/comment/reply-vote-check/:userId/:commentId/:replyId', async (req, res) => {
    try {
        const { userId, commentId, replyId } = req.params;
        const result = await pool.query(
            'SELECT * FROM vote_reply WHERE user_id = $1 AND reply_id = $2 AND comment_id = $3',
            [userId, replyId, commentId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to check vote',
            })
        }
    } catch (error) {
        console.error('Error checking vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/forum/reply-vote-check/:userId/:forumId/:replyId', async (req, res) => {
    try {
        const { userId, forumId, replyId } = req.params;
        const result = await pool.query(
            'SELECT * FROM vote_forum_reply WHERE user_id = $1 AND forum_reply_id = $2 AND forum_id = $3',
            [userId, replyId, forumId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to check vote',
            })
        }
    } catch (error) {
        console.error('Error checking vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})



app.get('/user/review/vote-check/:userId/:animeId/:reviewId', async (req, res) => {
    try {
        const { userId, animeId, reviewId } = req.params;
        const result = await pool.query(
            'SELECT * FROM vote_review WHERE user_id = $1 AND anime_id = $2 AND review_id = $3',
            [userId, animeId, reviewId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to check vote',
            })
        }
    } catch (error) {
        console.error('Error checking vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/review/vote', async (req, res) => {
    try {
        const { userId, animeId, reviewId, voteType } = req.body;

        const entityType = 'review';
        let reverseVoteType;

        if (voteType === 'upvote') {
            reverseVoteType = 'downvote';
        } else {
            reverseVoteType = 'upvote';
        }

        const reverseCheck = await pool.query(
            `SELECT * FROM vote_review WHERE user_id = $1 AND anime_id = $2 AND vote_type = $3 AND review_id = $4`,
            [userId, animeId, reverseVoteType, reviewId]
        )

        const mainCheck = await pool.query(
            `SELECT * FROM vote_review WHERE user_id = $1 AND anime_id = $2 AND vote_type = $3 AND review_id = $4`,
            [userId, animeId, voteType, reviewId]
        )

        const result = await pool.query(
            `CALL handle_vote($1, $2, $3, $4, $5)`,
            [userId, reviewId, entityType, voteType, animeId]
        );


        if (reverseCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Added vote'
            })
        } else if (mainCheck.rows.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Removed vote'
            })
        }

    } catch (error) {
        console.error('Error adding or removing vote: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/anime/review/delete/:userId/:animeId/:reviewId', async (req, res) => {
    try {
        const { userId, animeId, reviewId } = req.params;

        const check = await pool.query(
            `SELECT * FROM review WHERE anime_id = $1 AND review_id = $2`,
            [animeId, reviewId]
        )

        if (check.rows.length > 0) {
            const result = await pool.query(
                `DELETE FROM review WHERE anime_id = $1 AND review_id = $2`,
                [animeId, reviewId]
            )

            const interactionData = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Review deleted']
            )

            res.status(200).json({
                success: true,
                message: 'Review deleted',
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete review',
            })
        }
    } catch (error) {
        console.error('Error deleting review: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})



app.post('/user/anime/review', async (req, res) => {
    try {
        const { userId, animeId, reviewText, reviewRating } = req.body;

        const check = await pool.query(
            `SELECT * FROM review WHERE user_id = $1 AND anime_id = $2`,
            [userId, animeId]
        )

        if (check.rows.length > 0) {
            res.status(400).json({
                success: false,
                message: 'You already have a review for this anime',
            })
        } else {
            const result = await pool.query(
                'INSERT INTO review (user_id, anime_id, review_text, rating_score ) VALUES ($1, $2, $3, $4) RETURNING *',
                [userId, animeId, reviewText, reviewRating]
            )

            const interactionData = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Review Added']
            )

            const checkRating = await pool.query(
                `SELECT * FROM rating where user_id = $1 and anime_id = $2`,
                [userId, animeId]
            )

            if (checkRating.rows.length > 0) {
                const updateRating = await pool.query(
                    `UPDATE rating SET rating_score = $1 WHERE user_id = $2 and anime_id = $3`,
                    [reviewRating, userId, animeId]
                )

                const interactionData2 = await pool.query(
                    `CALL insert_user_interaction($1, $2, $3)`,
                    [userId, animeId, 'Rating Updated']
                )

            } else {
                const addRating = await pool.query(
                    `INSERT INTO rating (user_id, anime_id, rating_score) VALUES ($1, $2, $3)`,
                    [userId, animeId, reviewRating]
                )

                const interactionData3 = await pool.query(
                    `CALL insert_user_interaction($1, $2, $3)`,
                    [userId, animeId, 'Rating Added']
                )
            }

            if (result.rows.length > 0) {
                res.status(200).json(result.rows[0]);
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to add review',
                })
            }
        }

    } catch (error) {
        console.error('Error adding review: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/anime/reviews/:animeID/:userID', async (req, res) => {
    try {
        const { animeID, userID } = req.params;
        /* console.log(animeID, userID); */

        const result = await pool.query(
            `SELECT
                r.anime_id, r.review_date, r.review_id, r.review_text, r.rating_score, r.user_id,
                u.display_name, u.profile_picture, i.url, u.type AS user_type,
                COUNT(CASE WHEN vr.vote_type = 'upvote' THEN 1 END) AS upvote_count,
                COUNT(CASE WHEN vr.vote_type = 'downvote' THEN 1 END) AS downvote_count
            FROM
                review r
            LEFT JOIN vote_review vr ON r.review_id = vr.review_id
            LEFT JOIN user_table u ON r.user_id = u.user_id
            LEFT JOIN images i ON i.id = u.image_id
            WHERE
                r.anime_id = $1 AND u.user_id <> $2 AND u.onvacation <> TRUE
            GROUP BY
                r.review_id, r.anime_id, r.review_date, r.review_text, r.rating_score, r.user_id, u.display_name, u.profile_picture, i.url, user_type
                ORDER BY upvote_count DESC`,
            [animeID, userID]
        )

        /* console.log(result.rows); */

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get reviews',
            })
        }
    } catch (error) {
        console.error('Error getting reviews: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/anime/review/:animeID/:userID', async (req, res) => {
    try {
        const { animeID, userID } = req.params;

        const result = await pool.query(
            `SELECT
                r.anime_id, r.review_date, r.review_id, r.review_text, r.rating_score, r.user_id,
                u.display_name, u.profile_picture, i.url,
                COUNT(CASE WHEN vr.vote_type = 'upvote' THEN 1 END) AS upvote_count,
                COUNT(CASE WHEN vr.vote_type = 'downvote' THEN 1 END) AS downvote_count
            FROM
                review r
            LEFT JOIN vote_review vr ON r.review_id = vr.review_id
            LEFT JOIN user_table u ON r.user_id = u.user_id
            LEFT JOIN images i ON i.id = u.image_id
            WHERE
                r.anime_id = $1 AND u.user_id = $2
            GROUP BY
                r.review_id, r.anime_id, r.review_date, r.review_text, r.rating_score, r.user_id, u.display_name, u.profile_picture, i.url
                ORDER BY upvote_count DESC`,
            [animeID, userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json({
                bool: true,
                review: result.rows[0]
            });
        } else {
            res.status(200).json({
                bool: false,
                message: {},
            })
        }
    } catch (error) {
        console.error('Error getting user review: ' + error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/anime/comment/update', async (req, res) => {
    try {
        const { userId, animeId, commentId, commentText } = req.body;

        const result = await pool.query(
            'UPDATE comment SET comment_text = $1 WHERE comment_id = $2 AND anime_id = $3 RETURNING *',
            [commentText, commentId, animeId]
        )

        const interactionData = await pool.query(
            `CALL insert_user_interaction($1, $2, $3)`,
            [userId, animeId, 'Comment Updated']
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update comment',
            })
        }
    } catch (error) {
        console.error('Error updating comment: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/anime/reply/update', async (req, res) => {
    try {
        const { userId, replyId, commentId, replyText } = req.body;

        const result = await pool.query(
            'UPDATE reply SET reply_text = $1 WHERE comment_id = $2 AND reply_id = $3 RETURNING *',
            [replyText, commentId, replyId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update reply',
            })
        }
    } catch (error) {
        console.error('Error updating reply: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/anime/review/update', async (req, res) => {
    try {
        const { userId, animeId, reviewId, reviewText, ratingScore } = req.body;


        const result = await pool.query(
            'UPDATE review SET review_text = $1, rating_score = $2 WHERE review_id = $3 AND anime_id = $4 AND user_id = $5 RETURNING *',
            [reviewText, ratingScore, reviewId, animeId, userId]
        )

        const interactionData = await pool.query(
            `CALL insert_user_interaction($1, $2, $3)`,
            [userId, animeId, 'Review Updated']
        )

        const checkRating = await pool.query(
            `SELECT * FROM rating where user_id = $1 and anime_id = $2`,
            [userId, animeId]
        )

        if (checkRating.rows.length > 0) {
            const updateRating = await pool.query(
                `UPDATE rating SET rating_score = $1 WHERE user_id = $2 and anime_id = $3`,
                [ratingScore, userId, animeId]
            )

            const interactionData2 = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Rating Updated']
            )

        } else {
            const addRating = await pool.query(
                `INSERT INTO rating (user_id, anime_id, rating_score) VALUES ($1, $2, $3)`,
                [userId, animeId, ratingScore]
            )

            const interactionData3 = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Rating Added']
            )
        }


        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to update review',
            })
        }
    } catch (error) {
        console.error('Error updating review: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/anime/forumPost', async (req, res) => {
    try {
        const { userId, animeId, title, content } = req.body;

        const result = await pool.query(
            'INSERT INTO forums (created_by_user_id, anime_id, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, animeId, title, content]
        )

        if (result.rows.length > 0) {
            const interactionData = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Forum Created']
            )

            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to create forum post',
            })
        }
    } catch (error) {
        console.error('Error creating forum post: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/anime/forums/:animeId', async (req, res) => {
    try {
        const { animeId } = req.params;

        const result = await pool.query(
            `SELECT
                f.forum_id,
                f.title,
                f.description,
                TO_CHAR(f.created_at, 'DD Mon, YYYY') AS created_at,
                f.created_at AS ct,
                u.display_name,
                u.user_id,
                i.url,
                COUNT(DISTINCT fr.reply_id) AS total_replies,
                COUNT(DISTINCT ufi.interaction_id) FILTER (WHERE ufi.interaction_type = 'view') AS total_views,
                TO_CHAR(MAX(ufi_latest_reply.latest_reply_date), 'DD Mon, YYYY') AS latest_reply_date
            FROM
                forums f
            LEFT JOIN
                forum_replies fr ON f.forum_id = fr.forum_id
            LEFT JOIN
                user_forum_interaction ufi ON f.forum_id = ufi.forum_id
            LEFT JOIN
                user_table u ON u.user_id = f.created_by_user_id
            LEFT JOIN
                images i ON i.id = u.image_id
            LEFT JOIN (
                SELECT
                    forum_id,
                    MAX(created_at) AS latest_reply_date
                FROM
                    user_forum_interaction
                WHERE
                    interaction_type = 'reply'
                GROUP BY
                    forum_id
            ) ufi_latest_reply ON f.forum_id = ufi_latest_reply.forum_id
            WHERE
                f.anime_id = $1 AND u.onvacation <> TRUE
            GROUP BY
                f.forum_id, u.display_name, u.user_id, i.url
            `, [animeId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get forums',
            })
        }
    } catch (error) {
        console.error('Error getting forums: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/forum/:forumId', async (req, res) => {
    try {
        const { forumId } = req.params;

        const result = await pool.query(
            `SELECT
                f.forum_id,
                    f.anime_id,
                f.title,
                f.description,
                TO_CHAR(f.created_at, 'DD Mon, YYYY') AS created_at,
                    u.display_name,
                    i.url,
                    a.title AS anime_title,
                    f.created_by_user_id AS user_id
            FROM
                forums f
            LEFT JOIN
                    user_table u ON u.user_id = f.created_by_user_id
            LEFT JOIN
                    images i ON i.id = u.image_id
            LEFT JOIN
                    anime_table a ON a.anime_id = f.anime_id
            WHERE
                    f.forum_id = $1
            GROUP BY
                f.forum_id, u.display_name, i.url, a.title`,
            [forumId]
        )

        if (result.rows.length > 0) {
            const interaction = await pool.query(
                `CALL insert_user_forum_interaction($1, $2, 'view')`,
                [result.rows[0].user_id, forumId]
            )

            res.status(200).json(result.rows[0]);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get forum-info',
            })
        }
    } catch (error) {
        console.error('Error getting forum-info: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/forum/fetch-reply/:forumId', async (req, res) => {
    try {
        const { forumId } = req.params;

        const result = await pool.query(
            `SELECT
                u.user_id,
                u.display_name,
                u.email,
                fr.reply_id,
                fr.message AS reply_message,
                TO_CHAR(fr.created_at, 'DD Mon, YYYY at HH:MM AM') AS created_at,
                    fr.upvote,
                    fr.downvote,
                    fr.forum_id,
                    i.url
            FROM
                forum_replies fr
            JOIN
                user_table u ON fr.user_id = u.user_id
            LEFT JOIN
                    images i ON u.image_id = i.id
            WHERE
                fr.forum_id = $1 AND u.onvacation <> TRUE
            ORDER BY
                fr.reply_id ASC`, [forumId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get replies',
            })
        }
    } catch (error) {
        console.error('Error getting replies: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/forum/reply-post', async (req, res) => {
    try {
        const { userId, forumId, replyContent } = req.body;

        const result = await pool.query(
            'INSERT INTO forum_replies (user_id, forum_id, message) VALUES ($1, $2, $3) RETURNING *',
            [userId, forumId, replyContent]
        )

        const forumData = await pool.query(
            `SELECT created_by_user_id FROM forums WHERE forum_id = $1`, [forumId]
        )

        const notification = await pool.query(
            `INSERT INTO notifications (user_id, trigger_user_id, type, entity_type, entity_id)
                VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [forumData.rows[0].created_by_user_id, userId, "reply_forum", "forum", forumId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to create reply',
            })
        }
    } catch (error) {
        console.error('Error creating reply: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/forums-feed', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                f.forum_id,
                f.title,
                f.description,
                TO_CHAR(f.created_at, 'DD Mon, YYYY') AS created_at,
                f.created_at AS ct,
                u.display_name,
                u.user_id,
                i.url,
                a.title AS anime_title,
                a.anime_id AS anime_id,
                COUNT(DISTINCT fr.reply_id) AS total_replies,
                COUNT(DISTINCT ufi.interaction_id) FILTER (WHERE ufi.interaction_type = 'view') AS total_views,
                TO_CHAR(MAX(ufi_latest_reply.latest_reply_date), 'DD Mon, YYYY') AS latest_reply_date
            FROM
                forums f
            LEFT JOIN
                forum_replies fr ON f.forum_id = fr.forum_id
            LEFT JOIN
                user_forum_interaction ufi ON f.forum_id = ufi.forum_id
            LEFT JOIN
                user_table u ON u.user_id = f.created_by_user_id
            LEFT JOIN
                images i ON i.id = u.image_id
            LEFT JOIN
                anime_table a ON a.anime_id = f.anime_id
            LEFT JOIN (
                SELECT
                    forum_id,
                    MAX(created_at) AS latest_reply_date
                FROM
                    user_forum_interaction
                WHERE
                    interaction_type = 'reply'
                GROUP BY
                    forum_id
            ) ufi_latest_reply ON f.forum_id = ufi_latest_reply.forum_id
            GROUP BY
                f.forum_id, u.display_name, u.user_id, i.url, a.anime_id, a.title`
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get forums',
            })
        }
    } catch (error) {
        console.error('Error getting forums: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/favorites', async (req, res) => {
    try {
        const { userId, animeId } = req.body;

        const result = await pool.query(
            'INSERT INTO user_favorite_anime_list (user_id, anime_id) VALUES ($1, $2) RETURNING *',
            [userId, animeId]
        )

        if (result.rows.length > 0) {
            const interactionData = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Added to favorites']
            )
            res.status(200).json({
                success: true,
                message: 'Added to favorites',
            })
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to add to favorites',
            })
        }
    }
    catch (error) {
        console.error('Error adding to favorites: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.delete('/user/favorites/:userId/:animeId', async (req, res) => {
    try {
        const { userId, animeId } = req.params;

        const result = await pool.query(
            'DELETE FROM user_favorite_anime_list WHERE user_id = $1 AND anime_id = $2 RETURNING *',
            [userId, animeId]
        );

        if (result.rows.length > 0) {
            const interactionData = await pool.query(
                `CALL insert_user_interaction($1, $2, $3)`,
                [userId, animeId, 'Removed from favorites']
            )
            res.status(200).json({
                success: true,
                message: 'Removed from favorites',
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to remove from favorites',
            });
        }
    } catch (error) {
        console.error('Error removing from favorites: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

app.get('/user/favorites/check/:userId/:animeId', async (req, res) => {
    try {
        const { userId, animeId } = req.params;

        const result = await pool.query(
            'SELECT * FROM user_favorite_anime_list WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        );

        res.status(200).json({
            isInFavorites: result.rows.length > 0,
        });
    } catch (error) {
        console.error('Error checking favorites: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

app.post('/user/add_to_list', async (req, res) => {
    try {
        const { userId, animeId, status } = req.body;

        const check = await pool.query(
            'SELECT * FROM user_watchlist WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        )

        if (check.rows.length > 0) {
            const result = await pool.query(
                'UPDATE user_watchlist SET status = $1 WHERE user_id = $2 AND anime_id = $3 RETURNING *',
                [status, userId, animeId]
            )

            if (result.rows.length > 0) {
                const interactionData = await pool.query(
                    `CALL insert_user_interaction($1, $2, $3)`,
                    [userId, animeId, 'Updated list']
                )
                res.status(200).json({
                    success: true,
                    message: 'Updated to list',
                })
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update to list',
                })
            }
        }
        else {
            const result = await pool.query(
                'INSERT INTO user_watchlist (user_id, anime_id, status) VALUES ($1, $2, $3) RETURNING *',
                [userId, animeId, status]
            );

            if (result.rows.length > 0) {
                const interactionData = await pool.query(
                    `CALL insert_user_interaction($1, $2, $3)`,
                    [userId, animeId, 'Added to list']
                )
                res.status(200).json({
                    success: true,
                    message: 'Added to list',
                })
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to add to list',
                })
            }
        }
    } catch (error) {
        console.error('Error adding to list: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user/add_to_list/check/:userId/:animeId', async (req, res) => {
    try {
        const { userId, animeId } = req.params;

        const result = await pool.query(
            'SELECT * FROM user_watchlist WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        }
        else {
            res.status(400).json({
                isInList: false,
            })
        }
    } catch (error) {
        console.error('Error checking favorites: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

app.post('/user_interaction', async (req, res) => {
    try {
        const { userId, animeId, status } = req.body;

        const result = await pool.query(
            `CALL insert_user_interaction($1, $2, $3)`,
            [userId, animeId, status]
        )

        res.status(200).json({
            success: true,
            message: 'Added interaction',
        })
    } catch (err) {
        console.error('Error adding interaction: ', err.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/anime/rating', async (req, res) => {
    try {
        const { userId, animeId, rating } = req.body;
        /* console.log(userId, animeId, rating); */

        const check = await pool.query(
            'SELECT * FROM rating WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        )

        if (check.rows.length === 0) {
            const result = await pool.query(
                'INSERT INTO rating (user_id, anime_id, rating_score) VALUES ($1, $2, $3) RETURNING *',
                [userId, animeId, rating]
            );

            if (result.rows.length > 0) {
                const checkReview = await pool.query(
                    `SELECT * FROM review where user_id = $1 and anime_id = $2`,
                    [userId, animeId]
                )

                if (checkReview.rows.length > 0) {
                    const updateReview = await pool.query(
                        `UPDATE review SET rating_score = $1 WHERE user_id = $2 and anime_id = $3`,
                        [rating, userId, animeId]
                    )
                }

                const interactionData = await pool.query(
                    `CALL insert_user_interaction($1, $2, $3)`,
                    [userId, animeId, 'Rating Added']
                )

                res.status(200).json({
                    success: true,
                    message: 'Added rating',
                })
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to add rating',
                })
            }
        }

        else {
            const result = await pool.query(
                'UPDATE rating SET rating_score = $1 WHERE user_id = $2 AND anime_id = $3 RETURNING *',
                [rating, userId, animeId]
            );

            if (result.rows.length > 0) {
                const checkReview = await pool.query(
                    `SELECT * FROM review where user_id = $1 and anime_id = $2`,
                    [userId, animeId]
                )

                if (checkReview.rows.length > 0) {
                    const updateReview = await pool.query(
                        `UPDATE review SET rating_score = $1 WHERE user_id = $2 and anime_id = $3`,
                        [rating, userId, animeId]
                    )
                }

                const interactionData2 = await pool.query(
                    `CALL insert_user_interaction($1, $2, $3)`,
                    [userId, animeId, 'Rating Updated']
                )

                res.status(200).json({
                    success: true,
                    message: 'Updated rating',
                })
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to update rating',
                })
            }
        }
    } catch (error) {
        console.error('Error adding rating: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user/profile/watchList/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT a.*, array_agg(genre.genre_name) AS genres, uw.status
                FROM user_watchlist uw JOIN anime_table a ON uw.anime_id = a.anime_id
                            LEFT JOIN anime_genre ON a.anime_id = anime_genre.anime_id
                            LEFT JOIN genre ON anime_genre.genre_id = genre.genre_id
                WHERE user_id = $1
                GROUP BY a.anime_id, uw.status`,
            [userId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get watchlist',
            })
        }
    } catch (error) {
        console.error('Error getting watchlist: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user/profile/favoriteList/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT a.*, array_agg(genre.genre_name) AS genres
                FROM user_favorite_anime_list uf JOIN anime_table a ON uf.anime_id = a.anime_id
                            LEFT JOIN anime_genre ON a.anime_id = anime_genre.anime_id
                            LEFT JOIN genre ON anime_genre.genre_id = genre.genre_id
                WHERE user_id = $1
                GROUP BY a.anime_id`,
            [userId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get favorite list',
            })
        }
    } catch (error) {
        console.error('Error getting favorite list: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/anime/rating/check/:userId/:animeId', async (req, res) => {
    try {
        const { userId, animeId } = req.params;
        const result = await pool.query(
            'SELECT * FROM rating WHERE user_id = $1 AND anime_id = $2',
            [userId, animeId]
        );

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                isRated: false,
            })
        }
    } catch (err) {
        console.error('Error checking rating: ', err.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/search/getGenreTypes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM genre ORDER BY genre_name');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error getting genres: ', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user-profile/:userID/userActivity', async (req, res) => {
    try {
        const { userID } = req.params;

        const result = await pool.query(
            `WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS date
                ),
                activity_counts AS (
                SELECT
                    event_timestamp::date AS activity_date,
                    COUNT(DISTINCT user_id) AS user_count
                FROM
                    user_login_logout
                WHERE
                    event_timestamp >= CURRENT_DATE - INTERVAL '29 days'
										AND user_id = $1
                GROUP BY
                    event_timestamp::date
                )
                SELECT
                EXTRACT(day FROM ds.date) AS day,
                COALESCE(ac.user_count, 0) AS user_count
                FROM
                date_series ds
                LEFT JOIN activity_counts ac ON ds.date = ac.activity_date
                ORDER BY
                ds.date ASC`, [userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user activity',
            })
        }
    } catch (error) {
        console.error("Error fetching user activity", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user-profile/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const result = await pool.query(
            `SELECT u.*, i.*,  TO_CHAR(u.reg_date, 'DD Month, YYYY') AS join_date FROM user_table u LEFT JOIN images i ON i.id = u.image_id WHERE user_id = $1`,
            [userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user profile',
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user-profile/:userID/latestInteractions', async (req, res) => {
    try {
        const { userID } = req.params;
        const result = await pool.query(
            `SELECT a.*, TO_CHAR(recent_interactions.interaction_date, 'DD Month, YYYY') AS interaction_time
                FROM (
                SELECT DISTINCT ON (uai.anime_id) uai.anime_id, uai.interaction_date
                FROM user_anime_interactions uai
                WHERE uai.user_id = $1
                ORDER BY uai.anime_id, uai.interaction_date DESC
                ) AS recent_interactions
                LEFT JOIN anime_table a ON a.anime_id = recent_interactions.anime_id
                ORDER BY recent_interactions.interaction_date DESC
                LIMIT 4`,
            [userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user profile',
            })
        }
    } catch (error) {
        console.log("Error fetching latest interactions: ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user-profile/:userId/avgScore', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT ROUND(AVG(rating_score), 2) AS avgScore FROM rating WHERE user_id = $1`,
            [userId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user average score',
            })
        }
    } catch (error) {
        console.error("Error getting user avg score ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user-profile/forums/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT f.*, a.title AS anime_title,
                COUNT(DISTINCT fr.reply_id) AS total_replies,
                COUNT(DISTINCT ufi.interaction_id) FILTER (WHERE ufi.interaction_type = 'view') AS total_views
                FROM forums f
                JOIN anime_table a ON f.anime_id = a.anime_id
                LEFT JOIN forum_replies fr ON f.forum_id = fr.forum_id
                LEFT JOIN user_forum_interaction ufi ON f.forum_id = ufi.forum_id
                WHERE created_by_user_id = $1
                GROUP BY f.forum_id, a.title
                ORDER BY total_views DESC LIMIT 5`,
            [userId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user profile',
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/user-profile/reviews/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT
                r.anime_id, r.review_date, r.review_id, r.review_text, r.rating_score, r.user_id,
                u.display_name, u.profile_picture, i.url,
                COUNT(CASE WHEN vr.vote_type = 'upvote' THEN 1 END) AS upvote_count,
                COUNT(CASE WHEN vr.vote_type = 'downvote' THEN 1 END) AS downvote_count,
                a.title as anime_title
            FROM
                review r
            LEFT JOIN vote_review vr ON r.review_id = vr.review_id
            LEFT JOIN user_table u ON r.user_id = u.user_id
            LEFT JOIN images i ON i.id = u.image_id
            LEFT JOIN anime_table a ON a.anime_id = r.anime_id
            WHERE
                u.user_id = $1
            GROUP BY
                r.review_id, r.anime_id, r.review_date, r.review_text, r.rating_score, r.user_id, u.display_name, u.profile_picture, i.url, anime_title
                ORDER BY upvote_count DESC`,
            [userId]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user profile',
            })
        }
    } catch (error) {
        console.error("Error getting user reviews ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/user/report', async (req, res) => {
    try {
        const { reported_user_id, reporting_user_id, entity_id, entity_type, reason } = req.body;

        if (!entity_type) {
            entity_type = "user report"
        }

        const result = await pool.query(
            `INSERT INTO user_reports (reported_user_id, reporting_user_id, entity_id, entity_type, reason)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [reported_user_id, reporting_user_id, entity_id, entity_type, reason]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to report user',
            })
        }
    } catch (error) {
        console.error("Error reporting user ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/report/set-resolved', async (req, res) => {
    try {
        const { reportID } = req.body;

        const result = await pool.query(
            `UPDATE user_reports SET resolved = TRUE WHERE report_id = $1`,
            [reportID]
        )

        res.status(200).json({
            success: true,
        })
    } catch (error) {
        console.error("Error deleting report ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get(`/user-profile/:userID/lastActive`, async (req, res) => {
    try {
        const { userID } = req.params;

        const result = await pool.query(
            `WITH LastEvents AS (
                    SELECT
                        user_id,
                        event_type,
                        event_timestamp,
                        ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY event_timestamp DESC) AS rn
                    FROM
                        user_login_logout
                        WHERE
                                user_id = $1
                )

                , MaxLogin AS (
                    SELECT
                        user_id,
                        MAX(event_timestamp) AS last_login_timestamp
                    FROM
                        LastEvents
                    WHERE
                        event_type = 'Login'
                    GROUP BY
                        user_id
                )

                , MaxLogout AS (
                    SELECT
                        user_id,
                        MAX(event_timestamp) AS last_logout_timestamp
                    FROM
                        LastEvents
                    WHERE
                        event_type = 'Logout'
                    GROUP BY
                        user_id
                )

                SELECT
                    ml.user_id,
                    CASE
                        WHEN ml.last_login_timestamp > COALESCE(mo.last_logout_timestamp, '1970-01-01') THEN 'Active now'
                        ELSE to_char(mo.last_logout_timestamp, 'Mon DD, HH12:MI AM')
                    END AS last_active_status
                FROM
                    MaxLogin ml
                LEFT JOIN
                    MaxLogout mo ON ml.user_id = mo.user_id
                ORDER BY
                    ml.user_id`, [userID]
        )

        res.status(200).json(result.rows[0].last_active_status)
    } catch (error) {
        console.error("Error getting user last active ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user-profile/:userID/totalReplies', async (req, res) => {
    try {
        const { userID } = req.params;
        const result = await pool.query(
            `SELECT COUNT(*) FROM forum_replies WHERE user_id = $1`,
            [userID]
        )

        res.status(200).json(result.rows[0].count);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/userProfile/ban', async (req, res) => {
    try {
        const { banUntil, userID } = req.body;

        const result = await pool.query(
            `UPDATE user_table SET ban_until = $1 WHERE user_id = $2 RETURNING *`, [new Date(banUntil), userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to ban user',
            })
        }

    } catch (error) {
        console.error("Error banning user ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/userProfile/warn', async (req, res) => {
    try {
        const { adminID, userID } = req.body;

        const result = await pool.query(
            `UPDATE user_table SET warning_count = warning_count + 1 WHERE user_id = $1 RETURNING *`, [userID]
        )


        const notification = await pool.query(
            `INSERT INTO notifications (user_id, trigger_user_id, type)
                VALUES ($1, $2, $3) RETURNING *`,
            [userID, adminID, "warning"]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to warn user',
            })
        }

    } catch (error) {
        console.error("Error warning user ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/userProfile/promotion-demotion', async (req, res) => {
    try {
        const { adminID, userID, type } = req.body;
        console.log(userID, type)

        const result = await pool.query(
            `UPDATE user_table SET type = $1 WHERE user_id = $2 RETURNING *`, [type, userID]
        )

        if (type === "Moderator") {
            const notification = await pool.query(
                `INSERT INTO notifications (user_id, trigger_user_id, type)
                VALUES ($1, $2, $3) RETURNING *`,
                [userID, adminID, "Promoted"]
            )
        } else if (type === "Member") {
            const notification = await pool.query(
                `INSERT INTO notifications (user_id, trigger_user_id, type)
                VALUES ($1, $2, $3) RETURNING *`,
                [userID, adminID, "Demoted"]
            )
        }

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to promote or demote user',
            })
        }
    } catch (error) {
        console.error("Error promoting or demoting user ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/userActivity', async (req, res) => {
    try {
        const result = await pool.query(
            `WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS date
                ),
                activity_counts AS (
                SELECT
                    event_timestamp::date AS activity_date,
                    COUNT(DISTINCT user_id) AS user_count
                FROM
                    user_login_logout
                WHERE
                    event_timestamp >= CURRENT_DATE - INTERVAL '29 days'
                GROUP BY
                    event_timestamp::date
                )
                SELECT
                EXTRACT(day FROM ds.date) AS day,
                COALESCE(ac.user_count, 0) AS user_count
                FROM
                date_series ds
                LEFT JOIN activity_counts ac ON ds.date = ac.activity_date
                ORDER BY
                ds.date ASC`
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user activity',
            })
        }
    } catch (error) {
        console.error("Error getting user activity ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/userAnimeInteraction', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT uai.anime_id, a.title, uai.user_id, u.display_name, uai.interaction_type, TO_CHAR(uai.interaction_date, 'Mon DD, YYYY') AS interaction_date
                FROM user_anime_interactions uai
                LEFT JOIN user_table u ON u.user_id = uai.user_id
                LEFT JOIN anime_table a ON a.anime_id = uai.anime_id 
                ORDER BY interaction_date DESC
                LIMIT 250`
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user anime interaction',
            })
        }
    } catch (error) {
        console.error("Error getting user anime interaction ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user/:userID/notificationID', async (req, res) => {
    try {
        const { userID } = req.params;

        const result = await pool.query(
            `SELECT *, TO_CHAR(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time FROM notifications WHERE user_id = $1 AND seen <> TRUE AND type <> 'warning' ORDER BY created_at DESC`, [userID]
        )

        res.status(200).json(result.rows)
    } catch (error) {
        console.error("Error getting user notifications ID ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user/:userID/warnings', async (req, res) => {
    try {
        const { userID } = req.params;

        const result = await pool.query(
            `SELECT *, TO_CHAR(created_at, 'Mon DD, YYYY at HH12:MI AM') AS time FROM notifications WHERE user_id = $1 AND seen <> TRUE AND type = 'warning' ORDER BY created_at DESC`, [userID]
        )

        res.status(200).json(result.rows)
    } catch (error) {
        console.error("Error getting user warnings ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/notifications/admin-info', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.display_name, i.url
                FROM user_table u
                LEFT JOIN images i ON u.image_id = i."id"
                WHERE u."type" = 'Admin'`
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get admin info',
            })
        }
    } catch (error) {
        console.error("Error getting admin info ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/admin/reports/:userID', async (req, res) => {
    try {

        const { userID } = req.params;

        const result = await pool.query(
            `SELECT r.report_id, r.reported_user_id, urd.display_name AS reported_user_name, ird.url AS reported_user_img,
                r.reporting_user_id, urg.display_name AS reporting_user_name, irg.url AS reporting_user_img,
                r.entity_type, r.entity_id, r.reason, TO_CHAR(created_at, 'Mon DD, YYYY') AS report_date
                FROM user_reports r
                JOIN user_table urd ON urd.user_id = r.reported_user_id
                    LEFT JOIN images ird ON ird.id = urd.image_id
                JOIN user_table urg ON urg.user_id = r.reporting_user_id
                    LEFT JOIN images irg ON irg.id = urg.image_id
                WHERE resolved = FALSE AND (r.reported_user_id <> $1 OR r.reporting_user_id <> $2)`,
            [userID, userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get reports',
            })
        }
    } catch (err) {
        console.error("Error getting reports ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/notifications/user-info/:userID', async (req, res) => {
    try {
        const { userID } = req.params;

        const result = await pool.query(
            `SELECT u.user_id, u.display_name, i.url
                FROM user_table u
                LEFT JOIN images i ON u.image_id = i."id"
                WHERE u.user_id = $1`, [userID]
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0])
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user info',
            })
        }
    } catch (error) {
        console.error("Error getting user info ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/notifications/comment-upvote-downvote/:commentID', async (req, res) => {
    try {
        const { commentID } = req.params;

        const result = await pool.query(
            `SELECT a.title, c.anime_id, c.comment_text, TO_CHAR(c.comment_date, 'Mon DD, YYYY') AS comment_date
                FROM comment c
                LEFT JOIN anime_table a ON c.anime_id = a.anime_id
                WHERE c.comment_id = $1`, [commentID]
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error("Error getting comment info for notification ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/notifications/review-upvote-downvote/:reviewID', async (req, res) => {
    try {
        const { reviewID } = req.params;

        const result = await pool.query(
            `SELECT a.title, r.anime_id, r.review_text, TO_CHAR(r.review_date, 'Mon DD, YYYY') AS review_date, r.rating_score
                FROM review r
                LEFT JOIN anime_table a ON r.anime_id = a.anime_id
                WHERE r.review_id = $1`, [reviewID]
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error("Error getting review info for notification ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/notifications/reply-upvote-downvote/:replyID', async (req, res) => {
    try {
        const { replyID } = req.params;

        const result = await pool.query(
            `SELECT r.reply_text, TO_CHAR(r.reply_date, 'Mon DD, YYYY') AS reply_date
                FROM reply r
                WHERE r.reply_id = $1`, [replyID]
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error("Error getting reply info for notification ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/notifications/forumReply-upvote-downvote/:replyID', async (req, res) => {
    try {
        const { replyID } = req.params;

        const result = await pool.query(
            `SELECT f.title, f.forum_id, fr.message, TO_CHAR(fr.created_at, 'Mon DD, YYYY') AS forum_reply_date
                FROM forum_replies fr
                LEFT JOIN forums f ON f.forum_id = fr.forum_id
                WHERE fr.reply_id = $1`, [replyID]
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error("Error getting reply info for notification ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/notifications/forum/:forumID', async (req, res) => {
    try {
        const { forumID } = req.params;

        const result = await pool.query(
            `SELECT f.forum_id, f.title, f.description, TO_CHAR(f.created_at, 'Mon DD, YYYY') AS create_date
                FROM forums f
                WHERE forum_id = $1`, [forumID]
        )

        res.status(200).json(result.rows[0])
    } catch (error) {
        console.error("Error getting forum info for notification ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})



app.post('/notifications/set-seen', async (req, res) => {
    try {
        const { notificationID } = req.body;

        const result = await pool.query(
            `UPDATE notifications SET seen = TRUE WHERE notification_id = $1`, [notificationID]
        )

        res.status(200).json({
            success: true,
            message: 'Successfully set notification seen'
        })
    } catch (error) {
        console.error("Error setting notification seen ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.get('/user/genrePreference', async (req, res) => {
    try {
        const result = await pool.query(
            `WITH genre_counts AS (
                SELECT
                    g.genre_name,
                    COUNT(ugp.user_id) AS preference_count
                FROM
                    "genre" g
                LEFT JOIN
                    "user_genre_preference" ugp ON g.genre_id = ugp.genre_id
                GROUP BY
                    g.genre_name
            ), total_count AS (
                SELECT COUNT(DISTINCT user_id) AS total_users
                FROM "user_genre_preference"
            )
            SELECT
                genre_name,
                preference_count,
                ROUND((preference_count * 100.0) / total_users, 2) AS preference_percentage
            FROM
                genre_counts
            CROSS JOIN
                total_count
            ORDER BY
                preference_percentage DESC`
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get user genre preferences',
            })
        }
    } catch (error) {
        console.error("Error getting user genre preferences ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/user/delete', async (req, res) => {
    try {
        const { userID } = req.body;

        const result = await pool.query(
            `DELETE FROM user_table WHERE user_id = $1`, [userID]
        )

        res.status(200).json({
            success: true,
            message: 'Successfully deleted user',
        })
    } catch (error) {
        console.error("Error deleting user ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/go-on-a-vacation', async (req, res) => {
    try {
        const { userID } = req.body;

        const result = await pool.query(
            `UPDATE user_table SET onvacation = TRUE WHERE user_id = $1`, [userID]
        )

        res.status(200).json({
            success: true,
            message: 'Successfully set user on vacation',
        })
    } catch (error) {
        console.error("Error setting user on vacation ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.get('/search/anime/criteria', async (req, res) => {
    let { title, genre_name, release_date, airing_season, show_type, rated, orderBy } = req.query;
    let queryParams = [];
    let query = `
    SELECT
      a.anime_id,
      a.title,
      array_agg(DISTINCT g.genre_name) AS genres,
      COUNT(DISTINCT ui.interaction_id) AS total_interactions,
      a.release_date,
      a.airing_season,
      a.showtype,
      a.average_rating,
      a.favorites,
      a.rated,
      a.cover_image
    FROM
      anime_table a
    LEFT JOIN anime_genre ag ON a.anime_id = ag.anime_id
    LEFT JOIN genre g ON ag.genre_id = g.genre_id
    LEFT JOIN user_anime_interactions ui ON a.anime_id = ui.anime_id
  `;

    let whereConditions = [];
    if (title && title !== 'Any') {
        queryParams.push(`${title}%`);
        whereConditions.push(`a.title ILIKE $${queryParams.length}`);
    }
    if (genre_name && genre_name !== 'Any') {
        queryParams.push(`${genre_name}`);
        whereConditions.push(`g.genre_name ILIKE $${queryParams.length}`);
    }
    if (release_date && release_date !== 'Any') {
        queryParams.push(`${release_date}%`);
        whereConditions.push(`a.release_date ILIKE $${queryParams.length}`);
    }
    if (airing_season && airing_season !== 'Any') {
        queryParams.push(`${airing_season}%`);
        whereConditions.push(`a.airing_season ILIKE $${queryParams.length}`);
    }
    if (show_type && show_type !== 'Any') {
        queryParams.push(show_type);
        whereConditions.push(`a.showtype = $${queryParams.length}`);
    }
    if (rated && rated !== 'Any') {
        queryParams.push(rated);
        whereConditions.push(`a.rated = $${queryParams.length}`);
    }

    if (whereConditions.length > 0) {
        query += ` WHERE ` + whereConditions.join(' AND ');
    }

    query += `
    GROUP BY a.anime_id
  `;

    if (orderBy && orderBy !== 'Any') {
        if (orderBy === 'Popularity') {
            query += ` ORDER BY a.favorites DESC `;
        } else if (orderBy === 'Release Date') {
            query += ` ORDER BY a.release_date DESC `;
        } else if (orderBy === 'Title') {
            query += ` ORDER BY a.title ASC `;
        } else if (orderBy === 'Average Score') {
            query += ` ORDER BY a.average_rating DESC `;
        } else if (orderBy === 'Trending') {
            query += ` ORDER BY total_interactions DESC `;
        }
    }

    /* query += ` LIMIT 30 `; */

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
})


app.post('/user-request', async (req, res) => {
    const { title, details, type, language, genres, malLink, instructions, userID } = req.body.formData;

    try {
        const insertQuery = `
      INSERT INTO anime_requests (title, details, type, language, genres, mal_link, instructions, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
        const values = [title, details, type, language, genres.join(', '), malLink, instructions, userID];

        const response = await pool.query(insertQuery, values);
        res.status(201).json(response.rows[0]);
    } catch (error) {
        console.error('Error submitting anime request: ', error);
        res.status(500).json({ message: 'Error submitting anime request' });
    }
});

app.get('/admin/requests', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ar.*, TO_CHAR(ar.created_at, 'Mon DD, YYYY') AS req_date, u.display_name, i.url FROM anime_requests ar
            JOIN user_table u ON ar.user_id = u.user_id
            LEFT JOIN images i ON u.image_id = i.id`
        )

        if (result.rows.length > 0) {
            res.status(200).json(result.rows)
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to get anime requests',
            })
        }
    } catch (error) {
        console.error("Error getting anime requests ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})

app.post('/request/delete', async (req, res) => {
    try {
        const { requestID } = req.body;

        const result = await pool.query(
            `DELETE FROM anime_requests WHERE request_id = $1`, [requestID]
        )

        res.status(200).json({
            success: true,
            message: 'Successfully deleted anime request',
        })
    } catch (error) {
        console.error("Error deleting anime request ", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        })
    }
})


app.post('/anime/add', async (req, res) => {
    const { title, releaseDate, description, coverImage, ongoingStatus, runTime, airingSeason, source, showType, language, topImage, episodeNo, rated, trailer, genres, requestID } = req.body;

    try {
        const result = await pool.query('CALL add_anime($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
            [title, releaseDate, description, coverImage, ongoingStatus, runTime, airingSeason, source, showType.join(','), language, topImage, parseInt(episodeNo), rated, genres, title, trailer, new Date()]); 

        const result2 = await pool.query(
            `DELETE FROM anime_requests WHERE request_id = $1`, [requestID]
        )

        res.status(200).json({ message: 'Anime added successfully' });
    } catch (error) {
        console.error('Failed to add anime:', error);
        res.status(500).json({ error: 'Failed to add anime' });
    }
});


function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
}

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})



