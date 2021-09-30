const db = require('../database/db.js')

module.exports = {
  getReviews: function(page,count,sort,product_id,callBack){
    let query = `SELECT id AS review_id, rating,summary,recommend,response,body,date,reviewer_name,helpfulness FROM reviews WHERE product_id = ? and reported = 0 ORDER BY ${sort} DESC LIMIT ${count}`
    let queryArgs = [product_id, count]
    db.query(query,queryArgs, (err, data)=>{
      if(err){
        callBack(err)
      } else {
        Promise.all(
          data.map(review => {
            console.log(1)
            let newDate = new Date(review.date)
            newDate.toISOString()
            review.date = newDate
            review.photos = []

            let queryString = `SELECT id,url FROM review_photos WHERE review_id = ${review.review_id}`
            return new Promise((resolve, reject) => {
              db.query(queryString, (err, photos) => {
                if(err){
                  reject(err)
                } else {
                  console.log(2)
                  review.photos.push(photos)
                  resolve()
                }
              })
            })
          })
        )
        .then(
          console.log(3)
        )
      }
    })
  }
}