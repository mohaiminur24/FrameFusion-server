const express = require('express');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;


// middlewere is here
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
    res.send('FrameFusion website server is running well');
});


app.listen(port, ()=>{
    console.log(`This server running with ${port}`)
})