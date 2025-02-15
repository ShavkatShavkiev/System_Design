const db = require('../database/db.js')

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports = {
  getReviews: function(page,count,sort,product_id,callBack){
    // let queryString = `SELECT JSON_OBJECT('product', '${product_id}', 'count', '${count}', 'sort', '${sort}') as result `

    let queryString = `SELECT r.id as review_id,r.rating,r.summary,r.recommend, r.response, r.body, FROM_UNIXTIME(r.date/1000) as date, r.reviewer_name, r.helpfulness,
    JSON_ARRAYAGG(JSON_OBJECT('id', p.id, 'url', p.url)) as photos
    FROM reviews r LEFT JOIN review_photos p
    ON r.id = p.review_id
    WHERE product_id = ${product_id}
    GROUP BY r.id`


    db.query(queryString, (err, data) => {
      if(err){
        callBack(err)
      } else {
        callBack(null, data)
      }
    })
  },

  getMeta: function(productID, callBack){
    let rating = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    let recommended = {
      false: 0,
      true: 0
    }

    let characteristics = {

    }

    let queryString = `SELECT id, rating, recommend FROM reviews WHERE product_id = ${productID}`
    db.query(queryString, (err, data) => {
      if(err){
        callBack(err)
      }
      data.forEach(review => {
        rating[review.rating] = rating[review.rating] + 1;
        if(review.recommended === 1){
          recommended.true = recommended.true + 1;
        } else {
          recommended.false = recommended.false + 1;
        }
      })
      let queryChar = `SELECT characteristics.name, characteristics.id, AVG(characteristics_review.value) as value
       FROM characteristics_review RIGHT OUTER JOIN characteristics
       ON characteristics_review.characteristics_id = characteristics.id WHERE characteristics.product_id = ${productID}
       GROUP BY characteristics.name, characteristics.id`

      db.query(queryChar,  (err, data1)=> {
        if(err){
          console.log(err)
          callBack(err)
        } else {
          data1.forEach(meta => {
            characteristics[meta.name] = {id: meta.id, value: meta.value}
          })
          callBack(null, {product_id: productID,rating, recommended, characteristics})
        }
      })

    })
  },

  addReview: function(body, callBack){
    if(body.product_id === undefined || body.rating === undefined || body.body === undefined || body.recommend === undefined || body.name === undefined || body.email === undefined){
      callBack('Missing Question Parameter')
    }
    if(!validateEmail(body.email)){
      callBack('Invalid email')
    }
    let currentTime = Date.parse(new Date())

    let queryString = 'INSERT INTO reviews (product_id, rating, date, summary, body,recommend, reported, reviewer_name, reviewer_email, response, helpfulness) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    let queryArgs = [body.product_id, body.rating, currentTime, body.summary, body.body,body.recommend, false, body.name, body.email, null, 0]

    db.query(queryString, queryArgs, (err, response) => {
      if(err){
        callBack(err)
      }
      db.query('SELECT LAST_INSERT_ID()', (err, id) => {
        if(err){
          callBack(err)
        }
        Promise.all(
          body.photos.map(photo => {
            return new Promise((resolve, reject) => {
              let queryStringPhotos = `INSERT INTO review_photos (review_id, url) VALUES (${id[0]['LAST_INSERT_ID()']}, '${photo}')`
              db.query(queryStringPhotos, (err, success) => {
                if(err){
                  reject(err)
                }
                resolve(success)
              })
            })
          })
        )
        .then(response => {
          Promise.all(
            Object.keys(body.characteristics).map(key => {
              let value = body.characteristics[key]
              return new Promise((resolve, reject) => {
                let queryStringChar = `INSERT INTO characteristics_review (characteristics_id, review_id, value) VALUES (${+key}, ${id[0]['LAST_INSERT_ID()']}, ${value})`
                db.query(queryStringChar, (err, resp) => {
                  if(err){
                    reject(err)
                  }
                  resolve(resp)
                })
              })
            })
          )
          .then(response => callBack(null, response))
          .catch(err => {
            console.log(err)
            callBack(err)
          })
        })
        .catch(err => {
          console.log(err)
          callBack(err)
        })
      })

    })


  },

  markHelpful: function(reviewID, callBack){
    let queryString = `UPDATE reviews SET helpfulness = helpfulness + 1 WHERE id = ${reviewID}`
    db.query(queryString, (err, response) => {
      if(err){
        callBack(err)
      }
      callBack(null, response)
    })
  },

  reportReview: function(reviewID, callBack){
    let queryString = `UPDATE reviews SET reported = 1 WHERE id = ${reviewID}`
    db.query(queryString, (err, good) => {
      if(err){
        callBack(err)
      }
      callBack(null, good)
    })
  }

}