<template>
  <div class="container" v-if="this.$store.state.user.displayName">
    <h4>Welcome {{this.$store.state.user.username}}! What's happening?</h4>
    <r>
    <form @submit.prevent="validateBeforeSubmit" id="post" action="/posts/create" method="post">
      <div class="form-group" :class="{'has-error': errors.has('title') }" >
        <label for="title" class="pull-left">Title</label>
        <input name="title" id="title" v-validate="'required'" data-vv-delay="500" type="text" data-vv-as="title" placeholder="Title" class="form-control">
        <p class="text-danger" align="left" v-if="errors.has('title')">{{ errors.first('title') }}</p>
      </div>
      <div class="form-group" :class="{'has-error': errors.has('body') }" >
        <label for="body" class="pull-left">Body</label>
        <textarea name="body" id="body" v-validate="'required'" data-vv-delay="500" type="text" data-vv-as="body" placeholder="Body" class="form-control" rows=5>
        </textarea>
        <p class="text-danger" align="left" v-if="errors.has('body')">{{ errors.first('body') }}</p>
      </div>
    </form>
    <button class="btn btn-primary" form="post" type="submit">Post</button>
    <hr>
    <h5>{{ testPostLogic }}</h5>
    <!-- <div class="postContainer" v-show="updatePosts">
      <a v-for="post in this.postList">
        <div class="container">
          <div class="row">
            <h2 class="text-left">{{ post.title }}</h2> <br/>
            <h4 class="text-left">{{ post.body }}</h4> <br/>
            <div class="text-left col-xs-5">
              {{ post.author }}
            </div>
            <div class="text-right col-xs-5 col-xs-push-2width">
              {{ post.published }}
            </div>
            <button v-on:click="displayShortestPath(post)">Shortest Path</button>
          </div>
        </div>
        <hr>
      </a>
    </div> -->
    <!-- <a v-show="this.postsRetrieved" v-for="post in this.postList">
    <div class="container">
      <div class="row">
        <h2 class="text-left">{{ post.title }}</h2> <br/>
        <h4 class="text-left">{{ post.body }}</h4> <br/>
        <div class="text-left col-xs-5">
          {{ post.author }}
        </div>
        <div class="text-right col-xs-5 col-xs-push-2width">
          {{ post.published }}
        </div>
        <button v-on:click="displayShortestPath(post)">Shortest Path</button>
      </div>
    </div>
    <hr>
    </a> -->
    <div class="noPostsContainer" v-else> You have no posts :( </div>
  </div>
  <div class="container" v-else>
    <h4>Click the bull to login.</h4>
    <div >
    <a href="/login"><img src="https://i.imgur.com/bGlcYmy.png"/></a> 
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data: {
    postsRetrieved: false,
    friendsRetrieved: false, 
    postList: [],
  },
  computed : {
    testPostLogic: function () {
      return this.$store.getters.listOfPosts
    },
    updatePosts: function() {
      const currentPosts = this.$store.getters.listOfPosts
      const importantAttributes = {}
      
      if (this.postsRetrieved) {
        for (var i = 0; i < currentPosts.length; i ++) {
          importantAttributes[currentPosts.length - i - 1] = {
            author: currentPosts[i].username,
            title: currentPosts[i].title,
            body: currentPosts[i].body,
            published: currentPosts[i].createdOn
          }
        }

        this.postList = importantAttributes
        return true
      }

      return false
    }
  },
  methods: {
    displayShortestPath(friend){
      const destination = friend['author']
      console.log("SHOREST PATH", destination)
      if (destination == this.$store.state.user.username) {
        alert('Thats you dummy!')
      } else {
        this.$store.dispatch('getPosts', userName).then(res => {
          console.log(this.$store.state.friends)
        }, err => {
          console.log("Error", err)
        })
      }
    },
    validateBeforeSubmit(e) {
      e.preventDefault()
      this.$validator.validateAll().then((result) => {
        if (result) {
          document.querySelector('#post').submit()
          return
        }
      })
    }, 
    getPostsFromDB(){
      if (!this.postsRetrieved) {
        const userName = this.$store.state.user.username
        
        this.$store.dispatch('getPosts', userName).then(res => {
          console.log(this.$store.state.friends)
        }, err => {
          console.log("Error", err)
        })

        console.log("Posts retrieved")
        this.postsRetrieved = true
      }
    }
  },
  mounted() {
    // this.$store.dispatch('getUser')
  },
  updated() {
    this.getPostsFromDB()
  }
}
</script>
