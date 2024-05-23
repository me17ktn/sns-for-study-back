const firebaseAdmin = require("../firebase");
const router = require("express").Router();

const db = firebaseAdmin.firestore();

router.post('/register', async (req, res) => {
    const newUser = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        isOpen: true,
        posts: [],
        icon: "",
        following: [],
        follower: [],
        like: [],
        greeting: "よろしくお願いします"
    };

    const snapshot = await db.collection('users').where('email', '==', newUser.email).get();
    try {
        if (!snapshot.empty) {
            res.status(400).json('このメールアドレスは既に登録されています。');
        } else{
            await db.collection('users').add(newUser);
            res.status(201).json(newUser);
        }
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

router.post('/login', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
            let user = false;
            let loginUser
            snapshot.forEach((doc) => {
                const docData = doc.data()
                docMail = docData.email
                if(req.body.email === docMail){
                    user = true;
                    loginUser = doc;
                }});
        if (!user) {
            res.status(404).json("ユーザーが見つかりません")
        } else {
            const userData = loginUser.data()
            if(req.body.password !== userData.password){
                res.status(400).json('パスワードが間違っています')
            } else {
                const userReturn  = {...userData, userId: loginUser.id}
                res.status(200).json(userReturn);
            }
        }
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

module.exports = router;
