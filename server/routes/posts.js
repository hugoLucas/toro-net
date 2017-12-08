const express = require('express'),
      Post = require('../models/post'),
      axios = require('axios')

// Functions imported with 'require' must be set to var, not const.
var checkAuth = require('./index.js').checkAuth

/* apoc require statement must always go after the explicit loading of the 
 * .env file */
require('dotenv').load()
const apoc = require('apoc')

module.exports = (() => {

  'use strict';
  
  const router = express.Router();

  const postsProjection = {
      __v: false,
  }
  
  router.get('/', checkAuth, (req, res) => {
    Post.find({}, postsProjection, (err, posts) => {
      if (err) throw err
      else {
        res.json({ posts })
      }
    })
  })
  
  /* Endpoint: Delete single post based on new attempt. */
  router.get('/delete/:id', checkAuth, (req, res) => {
    Post.remove( Post.findById(req.params.id), postsProjection,
      (err, result) => {
      console.log('Endpoint: Delete Post')
      if (err) {
        console.log('Error in delete post')
        res.status(204).send() 
      }
      else {
        console.log('Success in Delete Post') //, result)
        res.status(200).send()
        //res.json({result})
      }
    })
  })
  
  /* Endpoint: Delete Many Posts Based on  */
  /* not working yet */
  /* ~TEMP~ Delete Many Posts */
  router.post('/deleteMany', checkAuth, (req, res) => {   
    /* json data */
    var errorsInDeleting=false
    console.log('Endpoint: Delete Many Posts')      
    for(var key in req.body.deleteIds) {
      var idToDelete = req.body.deleteIds[key]
      console.log('ID :  ', idToDelete )

      /* Delete One ID */
      Post.remove(Post.findById(idToDelete), postsProjection, 
        (err, result) => {
        if (err) {
          console.log('Failure (Error): Delete Post ', err)
          //res.status(204).send()//No record
        }
        if (!result) {//.length<1) {//} || result.length<1) {
          console.log('FAIL: No Results')
          console.log('FAIL: Did Not Delete ID: ', idToDelete)
          errorsInDeleting=true
          //res.status(204).send()//No record
        }
        else {
          console.log('Success in Delete Post')//, result)
          console.log('Deleted Post ID:', idToDelete )
          //res.status(200).send()
        }
      })

      /* try find [2] */
      // Post.find( Post.findById( idToDelete ) , function(err, posts) {
      //   if (err) throw err
      //   if (!posts || (posts.length<1) ) {
      //     console.log('Total Posts Found:  ', posts.length)
      //     console.log('No Post Found matching the keyword.')
      //     //res.json({ posts })   
      //   }
      //   else {
      //     console.log('Total Posts Found:  ', posts.length)
      //     console.log('')
      //     console.log('POSTS: ')
      //     console.log(' ',posts)    
      //     Post.remove( Post.findById( idToDelete ) ,(err, result) => {} )      
      //     //res.json({ posts })
      //   }        
      // })
      /*  */

    } //End for
    res.json({})       
  })
  
  /* Used by toro-net */
  router.post('/create', (req, res) => {
    const newPost = new Post({
      username: req.user.username, 
      title: req.body.title,
      body: req.body.body,
      createdOn: new Date
    })
    Post.create(newPost, (err) => {
      if (err) {
        console.log('Error detected: ', err)
        res.status(409).send()
      }
      else {
        console.log('Post created successfully!')
        res.redirect('/')
      }
    })
  })
  
  /* Used by test-script */
  router.post('/create/api', (req, res) => {
    console.log(req.body)
    const newPost = new Post({
      username: req.body.username, 
      title: req.body.title,
      body: req.body.body,
      createdOn: new Date
    })
    Post.create(newPost, (err) => {
      if (err) {
        console.log('Error detected: ', err)
        res.status(409).send()
      }
      else {
        console.log('Post created successfully!')
        // res.redirect('/')
        res.status(409).send()        
      }
    })
  })

  router.put('/update/:id', checkAuth, (req, res, next) => {
    console.log("EndPoint : update Post")
    Post.update(Post.findById(req.params.id), req.body, (err, result) => {
    if (err) {
      console.log("Post record doesn't exist!")
      res.status(204).send()
    }
    else {
      console.log("success")
      res.status(200).send()
    }
    })
  })
  
  /* The User object returned by passport does not have userId, switched 
   * to username */
  router.get('/list/:username', checkAuth, (req, res) => {
    const queryString = 
      `MATCH (u:User {username: '${req.params['username']}'})-[r:isFriends*1..1]-(v:User)
      WHERE u <> v
      RETURN r`
    const query = apoc.query(queryString)
    
    query.exec().then((result) => {
      var resultMap = new Map()
      
      /* Do not change variables back to const!! */
      for (var i = 0; i < result[0]['data'].length; i++) {
        var dataList = result[0]['data'][i]['row'][0]
        for (var j = 0; j < dataList.length; j++) {
          var rowNames = dataList[j]['connects'].split('<-->')
          rowNames = rowNames.sort()
          if ( resultMap.has(rowNames[0]) ) {
            if ( !resultMap.get(rowNames[0]).includes(rowNames[1]) ) {
              resultMap.get(rowNames[0]).push(rowNames[1])
            }
          } else {
            resultMap.set(rowNames[0], [rowNames[1]])
          }
        }
      }
      var friendList = [] 
      resultMap.forEach((value, key) => {
        friendList.push(value)
      })
      friendList[0].push(req.params['username'])
      
      Post.find().where('username').in(friendList[0]).exec(function (err, records) {
        if (err) {
          console.log("Error: ", err)
          res.status(400).send()
        } else {
          console.log('Post Successfully Retrived')
          console.log(records)
          res.send(records)
        }
      })

      // Post.find({ 'username': req.params.username }, (err, result) => {
      //   if (err) {
      //     console.log("Error: ", err)
      //     res.status(200).send()
      //   }
      //   else {
      //     console.log('Post Successfully Retrived')
      //     console.log(result)
      //     res.send(result)
      //   }
      // })
    }, (fail) => {
      console.log(fail) 
    })
  })    
  
  return router
})()
