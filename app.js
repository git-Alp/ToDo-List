//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-alp:qwer1234@clustertest.dnwgm.mongodb.net/todolistDB",
{useNewUrlParser: true, useUnifiedTopology: true});


const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const today  = new Date();
const theDate = today.toLocaleDateString("en-US", options);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "Click the checkbox to remove an item from the list."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if(foundItems == 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Items successfully saved to DB!");
        }
      });
      res.redirect("/");
    }else{
    res.render("list", {kindOfDay: theDate, items: foundItems});
  }
  });

});


app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, function(err, foundList){
  if(!err){
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    }else{
      res.render("list", {kindOfDay: foundList.name, items: foundList.items});
    }
  }
});

});


app.post("/", function(req, res){

const newListItem = req.body.newItem;
const listName = req.body.list;

const item = new Item({
  name: newListItem
});

if(listName == theDate){
  item.save();
  res.redirect("/");
}else{
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });
}

});


app.post("/delete", function(req, res){

const checkedItemId = req.body.checkbox;
const listName= req.body.listName;

if(listName == theDate){
  // silerken deleteOne kullanabileceğin gibi  Item.findByIdAndRemove(checkedItemId, function(err){...}) fonksiyonunu da aynı şekilde kullanabilirsin
  Item.deleteOne({_id: checkedItemId}, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Items successfully removed from DB!");
        res.redirect("/");
      }
  });
}else{
  List.findOneAndUpdate(
    {name: listName},
    {$pull: {items: {_id: checkedItemId}}},
    function(err){
      if(!err){
        res.redirect("/" + listName);
      }
    }
  );
}

});


app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000.");
});
