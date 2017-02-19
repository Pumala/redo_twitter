# SayWhatNow (Twitter Clone)

### Objective:

create a twitter clone app, utilizing the Mean Stack, where users can post tweets, retweet tweets, like tweets, follow/ unfollow users, and upload avatars

### Live Demo:

[SayWhatNow] (http://www.saywhatnow.life/)

** Currently uploading files works on localhost, but not in the live demo (process of resolving this server issue)

### Credits

Carolyn Lam

### Technologies used in the Front-end:

* Html
* Css
* JavaScript
* AngularJS

### Technologies used in the Back-end:

* Express
* NodeJS
* MongoDB

### Screenshots

##### Home
  ![home](public/images/say_what_now_home.png)

##### Profile

  ![home](public/images/say_what_now_profile.png)

### Code Snippets (Back-end)

  Challenges:

  Example 1 (Designing a MongoDB DB)

  Initially, I started with 2 schemas, Tweet and User. Later on when adding more functionality, I added a File schema for the main purpose of giving users the ability to upload files to be used as their avatars. Lastly, I added a Retweet schema. When designing it, there were several questions I asked myself, such as 'What do I want to accomplish?'. Even better, was being more specific with what I wanted to achieve, and asking myself, 'How does it connect to other schemas?'. The latter would prove to be extremely helpful.

  In hindsight, understanding my end goals better would have saved me a lot of time, for I ended up redesigning my schemas often upon adding a retweet functionality. After I would choose a certain design, I would then encounter issues that could only be resolved with a better design. For example, at one point, I decided my project didn't need a Retweet schema, and for my purposes, having a Tweet schema would work fine. Then in the front end, when rendering content, I realized there was more information I wanted to render on the pages that my current design couldn't offer, such as showing the date the retweet was made. So then I decided it was simpler to have two different schemas, in which I had the Retweet reference the Tweet schema and where each had its own date property.

  One of my other end goals, associated with the retweet functionality, was the ability to show both the tweet and the retweeter's avatars on the page. The easier approach it seemed was to give them each a property that would store the filename. However, I decided not to use that approach because this value was already a value stored in the User schema and I didn't want to waste space for a value we already had. I ended up instead making queries for the avatars and then linking them up with the correct tweet or retweet user.


### History

Project started: 1/19/2017

Project functionality completion: 1/24/2017

Project design started: 2/9/2017

Project design completion: 2/13/2017

Project deployed: 2/14/2017
