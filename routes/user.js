const firebaseAdmin = require("../firebase");
const router = require("express").Router();
const { FieldValue, FieldPath } = require("firebase-admin/firestore");

const db = firebaseAdmin.firestore();

router.put('/update/:id', async (req, res) => {
    if(req.body.userId === req.params.id){
        const updateUser = {
            username: req.body.username,
            password: req.body.password,
            // isOpen: req.body.isOpen,
            icon: req.body.icon,
            greeting: req.body.greeting
        };
        try{
            const snapshot = await db.collection('users').get();
            let user = false;
            snapshot.forEach((doc) => {
                if(req.body.userId === doc.id){
                    user = true;
                }});
            if (!user) {
                res.status(404).json('ユーザーが見つかりません');
            } else {
            await db.collection('users').doc(req.params.id).update(updateUser);
            res.status(200).json(updateUser);
            } 
        } catch (err) {
            res.status(400).json(err);
        }
    } else { 
        res.status(403).json("他の人の情報を変更することはできません")
    }
});

router.delete('/delete/:id', async (req, res) => {
    if(req.body.userId === req.params.id){
        try{
            const snapshot = await db.collection('users').get();
            let user = false;
            snapshot.forEach((doc) => {
                if(req.body.userId === doc.id){
                    user = true;
                }});
            if (!user) {
                res.status(404).json('ユーザーが見つかりません');
            } else {
            await db.collection('users').doc(req.params.id).delete();
            res.status(200).json("ユーザーを削除しました");
            } 
        } catch (err) {
            res.status(400).json(err);
        }
    } else { 
        res.status(403).json("他のユーザーを削除することはできません")
    }
});

router.get('/get', async (req, res) => {
    try{
        const userId = req.query.userId;
        const querySnapshot = await db.collection('users').where(FieldPath.documentId(), "==", userId).get();
        if (querySnapshot.empty) {
            res.status(404).json('ユーザーが見つかりません');
        } else {
            querySnapshot.forEach(doc => {
                const {password, ...other} = doc.data();
                const document = {...other, id: doc.id};
                return res.status(200).json(document);
            })
        } 
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
});

router.get('/search', async (req, res) => {
    try{
        const username = req.query.username;
        let users = [];
        const querySnapshot = await db.collection('users').orderBy("username").startAt(username).endAt(username + '\uf8ff').get();
        querySnapshot.forEach(doc => {
            const {password, ...other} = doc.data();
            const document = {...other, id: doc.id};
            users.push(document);
        })
        return res.status(200).json(users);
    } catch (err) {
        return res.status(400).json({error: err.message});
    }
});

router.put('/follow/:id', async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const userRef = db.collection('users').doc(req.params.id);
            const currentUserRef = db.collection('users').doc(req.body.userId);
            const userDoc = await userRef.get();
            const user = userDoc.data();
            const userFollow = user.follower || [];
            let isFollow = false;

            userFollow.forEach((doc) => {
                if(doc === req.body.userId) {
                    isFollow = true;
                }
            });

            if(!isFollow){
                userRef.update({
                    follower: FieldValue.arrayUnion(req.body.userId)
                });
                currentUserRef.update({
                    following: FieldValue.arrayUnion(req.params.id)
                });
                res.status(200).json("フォローしました");
            } else {
                userRef.update({
                    follower: FieldValue.arrayRemove(req.body.userId)
                });
                currentUserRef.update({
                    following: FieldValue.arrayRemove(req.params.id)
                });
                res.status(200).json("フォロー解除しました");
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        res.status(400).json("自身をフォローできません");
    }
});


module.exports = router;