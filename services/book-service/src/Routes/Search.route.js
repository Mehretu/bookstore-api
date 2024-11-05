const router = require('express').Router()
const SearchController = require('../Controllers/Search.controller')

router.get('/', SearchController.searchBooks)
router.get('/suggestions', SearchController.getSearchSuggestions)

module.exports = router