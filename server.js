const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const linebot = require("linebot");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;
const DB_PATH = process.env.DB_PATH || "./tango-v3_fixed_all.db";
const SECRET_KEY = "your_secret_key";

// LINE Bot 設定
const bot = linebot({
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_ACCESS_TOKEN,
});

// Middleware
const corsOptions = {
    origin: "http://localhost:3003",
    methods: ["POST", "GET"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));
app.use(compression());
app.use(morgan("combined"));

// Database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// users テーブル作成
db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            username TEXT NOT NULL
        )`
    );
});

// reminders テーブル作成
db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            word_id INTEGER NOT NULL,
            notify_date TEXT NOT NULL,
            notified BOOLEAN DEFAULT FALSE
        )`
    );
});

app.post("/webhook", (req, res) => {
    const events = req.body.events;
    events.forEach((event) => {
        if (event.type === "message") {
            console.log("ユーザーID:", U518a6ae865a52230db9f92a137b9d5c7); // ユーザーIDをログに表示
        }
    });
    res.sendStatus(200);
});



// ルート
app.get("/", (req, res) => {
    res.send("サーバーが正常に起動しています");
});

// ユーザー登録
app.post("/register", async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: "メールアドレス、パスワード、ユーザー名は必須です。" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = "INSERT INTO users (email, password, username) VALUES (?, ?, ?)";

        db.run(query, [email, hashedPassword, username], function (err) {
            if (err) {
                return res.status(500).json({ error: "登録中にエラーが発生しました。" });
            }
            res.status(201).json({ message: "登録成功！", userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "サーバーエラーが発生しました。" });
    }
});

// ユーザーログイン
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "メールアドレスとパスワードは必須です。" });
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.get(query, [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: "メールアドレスまたはパスワードが間違っています。" });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "メールアドレスまたはパスワードが間違っています。" });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
            res.cookie("token", token, { httpOnly: true, sameSite: "lax", secure: false });

            res.status(200).json({ message: "ログイン成功！", userId: user.id });
        } catch (error) {
            res.status(500).json({ error: "サーバーエラーが発生しました。" });
        }
    });
});

// 履歴登録と通知スケジュール生成
app.post("/history", (req, res) => {
    const { user_id, word_id, date, state } = req.body;

    if (!user_id || !word_id || !date || !state) {
        return res.status(400).json({ error: "必要なデータが不足しています。" });
    }

    const query = `
        INSERT INTO history (user_id, word_id, date, state)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [user_id, word_id, date, state], function (err) {
        if (err) {
            return res.status(500).json({ error: "履歴の保存に失敗しました。" });
        }

        const reminderDates = [1, 7, 30].map((days) =>
            new Date(new Date(date).setDate(new Date(date).getDate() + days))
                .toISOString()
                .split("T")[0]
        );

        const reminderQuery = `
            INSERT INTO reminders (user_id, word_id, notify_date)
            VALUES (?, ?, ?)
        `;

        const stmt = db.prepare(reminderQuery);
        reminderDates.forEach((notifyDate) => {
            stmt.run(user_id, word_id, notifyDate);
        });
        stmt.finalize();

        res.status(201).json({ message: "履歴と通知スケジュールが正常に保存されました。" });
    });
});

// 通知送信
app.post("/send-notifications", (req, res) => {
    const today = new Date().toISOString().split("T")[0];

    const query = `
        SELECT r.id AS reminder_id, r.user_id, r.word_id, w.word, w.jword
        FROM reminders r
        JOIN word w ON r.word_id = w.id
        WHERE r.notify_date = ? AND r.notified = FALSE
    `;

    db.all(query, [today], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "通知データ取得中にエラーが発生しました。" });
        }

        rows.forEach(({ reminder_id, user_id, word, jword }) => {
            const message = `復習通知: ${word} (${jword}) を復習してください！`;

            bot.push(user_id, message)
                .then(() => {
                    const updateQuery = `
                        UPDATE reminders
                        SET notified = TRUE
                        WHERE id = ?
                    `;
                    db.run(updateQuery, [reminder_id]);
                })
                .catch((err) => {
                    console.error("LINE通知エラー:", err.message);
                });
        });

        res.status(200).json({ message: "通知送信完了。" });
    });
});

// 単語取得エンドポイント
app.get("/words/:level", (req, res) => {
    const level = parseInt(req.params.level, 10);
    const userId = req.query.userId || 1; // デフォルトのユーザーID

    const query = `
        SELECT id, word, jword
        FROM word
        WHERE level = ?
          AND id NOT IN (
              SELECT word_id
              FROM history
              WHERE user_id = ? AND date = date('now')
          )
        LIMIT 100
    `;

    db.all(query, [level, userId], (err, rows) => {
        if (err) {
            console.error("Error fetching words:", err.message);
            res.status(500).json({ error: "Failed to fetch words." });
            return;
        }

        const formattedRows = rows.map((row) => {
            const correctOption = { word: row.word, meaning: row.jword };

            const incorrectOptions = rows
                .filter((r) => r.id !== row.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 2)
                .map((r) => ({ word: r.word, meaning: r.jword }));

            const options = [correctOption, ...incorrectOptions].sort(() => Math.random() - 0.5);

            return {
                id: row.id,
                word: row.word,
                options,
                correctOption: options.indexOf(correctOption),
            };
        });

        res.json(formattedRows);
    });
});

// 履歴登録エンドポイント
app.post("/history", (req, res) => {
    const { user_id, word_id, date, state } = req.body;

    // 必須データのバリデーション
    if (!user_id || !word_id || !date || !state) {
        console.error("リクエストデータが不足しています:", req.body);
        return res.status(400).json({ error: "必要なデータが不足しています。" });
    }

    // INSERTクエリ
    const query = `
        INSERT INTO history (user_id, word_id, date, state)
        VALUES (?, ?, ?, ?)
    `;

    // データベースに保存
    db.run(query, [user_id, word_id, date, state], (err) => {
        if (err) {
            console.error("履歴保存エラー:", err.message);
            return res.status(500).json({ error: "履歴の保存に失敗しました。" });
        }
        res.status(201).json({ message: "履歴が正常に保存されました。" });
    });
});

app.get("/history_v2", (req, res) => {
    const userId = req.session?.line_user_id || req.query.userId;

    if (!userId) {
        console.error("ユーザーIDが不足しています。");
        return res.status(400).json({ error: "ユーザーIDが不足しています。" });
    }

    const getHistoryQuery = `
        SELECT 
            history.id AS history_id,
            history.user_id,
            history.date,
            history.state,
            word.word,
            word.jword,
            word.type,
            word.level
        FROM 
            history
        INNER JOIN 
            word 
        ON 
            history.word_id = word.id
        WHERE 
            history.user_id = ?
        ORDER BY 
            history.date DESC
    `;

    db.all(getHistoryQuery, [userId], (err, rows) => {
        if (err) {
            console.error("履歴取得エラー:", err.message);
            return res.status(500).json({ error: "履歴の取得中にエラーが発生しました。" });
        }

        if (!rows || rows.length === 0) {
            console.warn("履歴が見つかりません。");
            return res.status(404).json({ error: "履歴が見つかりません。" });
        }

        res.status(200).json({ history: rows });
    });
});



// 間違えた履歴取得エンドポイント
app.get("/history/incorrect", (req, res) => {
    const userId = req.query.userId || 1;
    const date = req.query.date || "1970-01-01";

    if (!userId) {
        return res.status(400).json({ error: "userId is required." });
    }

    const query = `
        SELECT DISTINCT h.word_id, w.word, w.jword, h.date
        FROM history h
        JOIN word w ON h.word_id = w.id
        WHERE h.user_id = ? AND h.state = 2 AND h.date >= ?
        ORDER BY h.date DESC
    `;

    db.all(query, [userId, date], (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: "Failed to fetch data." });
        }

        res.json(
            rows.map((row) => ({
                wordId: row.word_id,
                word: row.word,
                jword: row.jword,
                date: row.date,
            }))
        );
    });
});


app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});



app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
