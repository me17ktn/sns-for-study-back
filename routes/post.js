const firebaseAdmin = require("../firebase");
const router = require("express").Router();
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

const db = firebaseAdmin.firestore();

router.post('/:id', async (req, res) => {
    const userId = req.body.userId; 
    const newPost = {
        userId: userId,
        subject: req.body.subject,
        time: req.body.time,
        postTime: FieldValue.serverTimestamp(),
        desc: req.body.desc,
        liked: [],
        comment: [],
    };

    if(userId === req.params.id){
        try {
            const id = await db.collection('posts').add(newPost);
            const user = db.collection('users').doc(userId);
            user.update({
                posts: FieldValue.arrayUnion(id)
            });
            res.status(201).json(newPost);
        } catch (err) {
            res.status(400).json({error: err.message});
        }
    } else {
        res.status(400).json("投稿に失敗しました")
    }
});

router.put('/update/:id', async (req, res) => {
    const updatePost = {
        userId: req.body.userId,
        subject: req.body.subject,
        time: req.body.time,
        desc: req.body.desc,
        liked: [],
        comment: [],
    };
    try{
        const snapshot = await db.collection('posts').get();
        let isPost = false;
        snapshot.forEach((doc) => {
            if(req.params.id === doc.id) {
                isPost = true
            }
        });
        if (!isPost) {
            res.status(404).json('投稿が見つかりません');
        } else {
            const postRef = db.collection("posts").doc(req.params.id);
            const postSnapshot = await postRef.get();
            const postData = postSnapshot.data();
            const UserId = postData.userId;
            if(updatePost.userId === UserId){
                await db.collection("posts").doc(req.params.id).update(updatePost);
                res.status(200).json(updatePost);
            }  else { 
                res.status(403).json("他のユーザーの投稿を変更することはできません")
            }
        }
    } catch (err) {
        res.status(400).json(err);
    }
});

router.delete('/delete/:id', async (req, res) => {
    try{
        const snapshot = await db.collection('posts').get();
        let isPost = false;
        snapshot.forEach((doc) => {
            if(req.params.id === doc.id){
                isPost = true;
            }
        });
        if (!isPost) {
            res.status(404).json('投稿が見つかりません');
        } else {
            const postRef = db.collection("posts").doc(req.params.id);
            const postSnapshot = await postRef.get();
            const postData = postSnapshot.data();
            const UserId = postData.userId;
            if(req.body.userId === UserId){
                const dlt = await db.collection('posts').doc(req.params.id).delete();
                res.status(200).json("投稿を削除しました");
                user.update({
                    posts: FieldValue.arrayRemove(dlt)
                });
            } else { 
                res.status(403).json("他のユーザーの投稿を削除することはできません")
            }
        } 
    } catch (err) {
        res.status(400).json(err);
    }
});

router.get('/get/:id', async (req, res) => {
    try{
        const snapshot = await db.collection('posts').get();
        let isPost = false;
        let post;
        snapshot.forEach((doc) => {
            if(req.params.id === doc.id){
                isPost = true;
                post = doc;
            }
        });
        if (!isPost) {
            res.status(404).json('投稿が見つかりません');
        } else {
            const document = {...post.data(), id: post.id}
            const postDate = document.postTime.toDate();
            document.postTime = postDate
            res.status(200).json(document);
        } 
    } catch (err) {
        res.status(400).json(err);
    }
});

router.put('/like/:id', async (req, res) => {
    try{
        const posts = db.collection('posts');
        const snapshot = await posts.get();
        let isPost = false;
        let postRef;
        snapshot.forEach((doc) => {
            if(req.params.id === doc.id){
                isPost = true;
                postRef = posts.doc(doc.id);
            }
        });
        if(!isPost) {
            res.status(404).json("投稿が見つかりません")
        } else {
            const userLikeRef = db.collection('users').doc(req.body.userId);
            const userLikeSnapshot = await userLikeRef.get();
            const userLike = userLikeSnapshot.data();
            const like = await userLike.like;
            let isLike = false;
            like.map((doc) => {
                if(doc === req.params.id) {
                    isLike = true;
                }
            });
            
            if(!isLike){
                postRef.update({
                    liked: FieldValue.arrayUnion(req.body.userId)
                });
                userLikeRef.update({
                    like: FieldValue.arrayUnion(req.params.id)
                });
                res.status(200).json("いいねしました");
            } else {
                postRef.update({
                    liked: FieldValue.arrayRemove(req.body.userId)
                });
                userLikeRef.update({
                    like: FieldValue.arrayRemove(req.params.id)
                });
                res.status(200).json("いいね解除しました");
            }
        }
    } catch (err) {
        res.status(400).json({error: err.message});
    }
});

router.get('/timeline/my/:userId', async (req, res) => {
    try{
        const postRef = await db.collection('posts').orderBy("postTime").get();
        let userPosts = [];

        postRef.forEach((post) => {
            const postData = post.data();
            const data = {...postData, id:post.id};
            const postUser = data.userId;
            if(postUser === req.params.userId) {
                userPosts.unshift(data);
            }
        });

         res.status(200).json(userPosts);
    
        } catch (err) {
        return res.status(400).json({error: err.message});
    }
});

router.get('/timeline/ff/:userId', async (req, res) => {
    try {
        const currentUserRef = db.collection('users').doc(req.params.userId);
        const postRef = await db.collection('posts').orderBy("postTime").get();
        const currentUser = await currentUserRef.get();
        const currentUserData = currentUser.data();
        const currentUserFollow = currentUserData.following || [];
        let userPosts = [];
        
        if (!postRef.empty) {
            postRef.forEach((post) => {
                const postData = post.data();
                const postUser = postData.userId;
                if (postUser === req.params.userId || currentUserFollow.includes(postUser)) {
                    const data = { ...postData, id: post.id };
                    userPosts.unshift(data);
                }
            });
        }
        
        res.status(200).json(userPosts);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});


module.exports = router;