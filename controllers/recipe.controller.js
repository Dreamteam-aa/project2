const mongoose = require('mongoose');
const Recipe = require('../models/recipe.model');
const Ingredient = require('../models/ingredient.model');
const User = require('../models/user.model');
const passport = require('passport');


const dbx = require ('../config/dropbox.config');


module.exports.show = (req, res, next) => {
    Recipe.find()
        .populate('author')
        .sort({ createdAt: -1 })
        .then((recipes) => {
            if(recipes.length > 0){
                res.render('recipes/show', {
                    recipes: recipes,
                });
            } else {
                res.render('recipes/show');
            }
        })
        .catch(error => next(error));
}

module.exports.showOne = (req, res, next) => {
    Recipe.findById(req.params.id).then((recipe) => {
         res.render('recipes/showOne', {
           recipe: recipe
         });
       }); 
}

module.exports.delete = (req, res, next) => {
    console.log("ASDF");
    Recipe.findByIdAndRemove(req.params.id)
    .then((recipe) => {
         res.redirect('/profile');
       }); 
}

module.exports.edit = (req, res, next) => {
    Recipe.findById(req.params.id)
    .then((recipe) => {
         res.render('recipes/edit', {
           recipe: recipe
         });
       }); 
}

module.exports.doEdit = (req, res, next) => {
    const ingredients = req.body.ingredients.split(",");
    const img = req.file ? req.file.filename : '';
    const updateObj = req.file
        ? { name: req.body.name, description: req.body.description, ingredients: [], imgs: img }
        : { name: req.body.name, description: req.body.description, ingredients: [] }
    Recipe.findByIdAndUpdate(req.params.id,{$set: updateObj}, { 'new': true } )
    .then((savedRecipe) => {
        ingredients.forEach(element => {
            Ingredient.findOne({ name: element })
            .then(ing => {
                if (ing != null) {
                    Recipe.findByIdAndUpdate(savedRecipe._id, { $push: { ingredients: { ingredient: ing.name }}})
                            .then(() =>  next());
                    next();
                } else {
                    ing = new Ingredient({
                        name: element
                    });
                    ing.save()
                    .then((savedIng) => {
                        Recipe.findByIdAndUpdate(savedRecipe._id, { $push: { ingredients: { ingredient: savedIng.name }}})
                            .then(() =>  next());
                    })
                    .catch(error => {
                        if (error instanceof mongoose.Error.ValidationError) {
                            res.render('recipes/edit', { 
                                recipes: recipes,
                                error: error.errors 
                            });
                        } else {
                            next(error);
                        }
                    });
                }
            })
            .catch(error => next(error));
        });
        if (img) { 
            dbx.uploadDB(img, savedRecipe);
            res.redirect('/profile');
        } else {
            res.redirect('/profile');
        }
    }).catch(error => {
        if (error instanceof mongoose.Error.ValidationError) {
        res.render('recipe/edit', {
            recipe: recipe,
            error: error.errors
        });
        } else {
        next(error);
        }
    });
}

module.exports.search = (req, res, next) => {
    console.log(req.body);
    const ingredients = req.body.ingredients.split(",");
    Recipe.find( { 'ingredients.ingredient':{ $all : ingredients} })
        .then(recipes => {
            if( recipes.length > 0 ){
                res.render('recipes/search', {
                recipes: recipes,
                ingredients: ingredients
                });
            } else {
                res.render('recipes/search', {
                    recipes: recipes,
                    ingredients: ingredients,
                    errors: {
                        text: "We could not find any recipes including these ingredients."
                    } 
                    });
            }
        })
        .catch(error => next(error));
}

module.exports.create = (req, res, next) => {
    res.render('recipes/new'); 
}

module.exports.doCreate = (req, res, next) => {
    ingredients = req.body.ingredients.split(",");
    recipes = req.body.name;
    img = req.file ? req.file.filename : '';
    recipe = new Recipe({
       name: req.body.name,
       description: req.body.description,
       author: req.user._id,
       directions: req.body.directions
      });
    recipe.save()
        .then((savedRecipe) => {
            console.log(savedRecipe);
            dbx.uploadDB(img,savedRecipe._id);
            ingredients.forEach(element => {
                ing = new Ingredient({
                    name: element
                });
              Ingredient.findOne({ name: element })
                .then(ing => {
                    if (ing != null) {
                        Recipe.findByIdAndUpdate(savedRecipe._id, { $push: { ingredients: { ingredient: ing.name }}})
                                .then(() =>  next());
                        next();
                    } else {
                        ing = new Ingredient({
                            name: element
                        });
                        ing.save()
                        .then((savedIng) => {
                            Recipe.findByIdAndUpdate(savedRecipe._id, { $push: { ingredients: { ingredient: savedIng.name }}})
                                .then(() =>  next());
                        })
                        .catch(error => {
                            if (error instanceof mongoose.Error.ValidationError) {
                                res.render('recipes/new', { 
                                    recipes: recipes,
                                    error: error.errors 
                                });
                            } else {
                                next(error);
                            }
                        });
                 }
                }).catch(error => next(error));
            });
            setTimeout(res.redirect("/profile"),10);
        }).catch(error => {
          if (error instanceof mongoose.Error.ValidationError) {
            res.render('recipe/new', {
              recipe: recipe,
              error: error.errors
            });
          } else {
            next(error);
          }
        });
}

<<<<<<< HEAD
=======
function uploadDB(filePath,savedRecipe){
    path = "./public/uploads/" + filePath;
    fs.readFile(path, function (err, contents) {
        if (err) {
          console.log('Error: ', err);
        } 
        // This uploads basic.js to the root of your dropbox
        dbx.filesUpload({ path: '/' + filePath, contents: contents })
          .then(function (response) {
            parameters = {
                    "path": response.path_lower,
                    "settings": {
                        "requested_visibility": "public"
                }
            };
            dbx.sharingCreateSharedLinkWithSettings(parameters)
            .then(response => {
                urlAux = response.url.split("/s");
                url = urlAux[1].split("?");
                console.log(url);
                Recipe.findByIdAndUpdate(savedRecipe, { imgs: url[0] }, { new: true })
                                .then((recipe) => console.log(recipe));
               // return response.url;
            })
            .catch(function (err) {
                console.log(err);
              });
          })
          .catch(function (err) {
            console.log(err);
          });
      });
    
}
>>>>>>> fix: update ingredients


  