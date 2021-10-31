# System Design
This is a back-end micro service designed to support the REVIEWS section of a ecommerce Store.

# Schema
<img src='./Screen Shot 2021-10-29 at 11.20.30 AM.png'/>

# Scaling
<img src='./Screen Shot 2021-10-29 at 11.38.12 AM.png'/>

# End Points 
Get meta data for a product
/api/reviews/meta/[PRODUCT_ID]

Get reviews for a product 
/api/reviews/
PARAMAS: page, count, sort, Product_id(REQUIRED)

Add a review 
/api/reviews 

Mark a review as helpfull 
/api/reviews/:review_id/helpful

Report a review 
/api/reviews/:review_id/report

# How to run
<ol>
  <li>Clone repo on to your local machine</li>
  <li>Run 'npm install'</li>
  <li>Run 'npm start'</li>
</ol>

## How to run tests
 Run 'npm run test'
