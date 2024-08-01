const markdownIt = require("markdown-it");
const lodashChunk = require('lodash.chunk');

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

module.exports = function (eleventyConfig) {
  let markdownItOptions = {
		html: true,
		breaks: true,
		linkify: true,
	};

  eleventyConfig.addPassthroughCopy("./src/assets");
  eleventyConfig.addWatchTarget("./src/assets/");
  eleventyConfig.setLibrary("md", markdownIt(markdownItOptions));

  eleventyConfig.addFilter("filterByAuthor", function(posts, authorName) {
    return posts.filter(item => item.data.author === authorName);
  });

  eleventyConfig.addFilter("getRandom2", function(items,avoid) {
    /*
    this filter assumes items are pages
    we need to loop until we don't pick avoid,
    */
    if(!items.length || items.length < 2) return;

    let selected = items[Math.floor(Math.random() * items.length)];
    while(selected.url === avoid.url) {
      selected = items[Math.floor(Math.random() * items.length)];
    }
    return selected;
  });

  eleventyConfig.addFilter("getRandomItems", function(items) {
    /* Get 100 random items from collections.post */
    // Shuffle the array
    const shuffledArray = shuffleArray(items);
    // Return the first 100 elements
    return shuffledArray.slice(0, 100);
  });

  // Create a collection containing a list of all tags
  eleventyConfig.addCollection("tagsList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(function(item) {
      if ("tags" in item.data) {
        let tags = item.data.tags;

        // Optionally filter things out before you iterate over them
        const excluded = new Set(['post', 'featured', 'author']);
        tags = tags.filter(tag => !excluded.has(tag));
        for (let tag of tags) {
          tagSet.add(tag);
        }
      }
    });
    tags = [...tagSet]; // Convert the Set to an array
    tags.sort();
    return tags;
  });;


  /*
    Add double pagination to poem topics.

    credits: https://github.com/11ty/eleventy/issues/332#issuecomment-445236776
  */
  eleventyConfig.addCollection("doublePagination", function(collection) {
    // Get unique list of tags
    let tagSet = new Set();
    collection.getAllSorted().map(function(item) {
      if( "tags" in item.data ) {
        let tags = item.data.tags;

        // optionally filter things out before you iterate over?
        const excluded = new Set(['post', 'featured', 'author']);
        tags = tags.filter(item => !excluded.has(item));
        for (let tag of tags) {
          tagSet.add(tag);
        }

      }
    });

    // Get each item that matches the tag
    let paginationSize = 20;
    let tagMap = [];
    let tagArray = [...tagSet];
    for( let tagName of tagArray) {
      let tagItems = collection.getFilteredByTag(tagName);
      let pagedItems = lodashChunk(tagItems, paginationSize);
      // console.log( tagName, tagItems.length, pagedItems.length );
      for( let pageNumber = 0, max = pagedItems.length; pageNumber < max; pageNumber++) {
        tagMap.push({
          tagName: tagName,
          pageNumber: pageNumber,
          pageData: pagedItems[pageNumber]
        });
      }
    }

    /* return data looks like:
      [{
        tagName: "tag1",
        pageNumber: 0
        pageData: [] // array of items
      },{
        tagName: "tag1",
        pageNumber: 1
        pageData: [] // array of items
      },{
        tagName: "tag1",
        pageNumber: 2
        pageData: [] // array of items
      },{
        tagName: "tag2",
        pageNumber: 0
        pageData: [] // array of items
      }]
     */
    //console.log( tagMap );
    return tagMap;
  });

  return {
    dir: {
      input: "src",
      output: "public"
    }
  };
}
