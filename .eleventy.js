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

  eleventyConfig.addFilter("getAuthorImage", function(authorName, authorsCollection) {
    const author = authorsCollection.find(author => author.data.name === authorName);
    if (author === undefined) {
      return "/assets/images/authors/default.jpg";
    }
    return author.data.image;
  });

  // To be used to get a recommendation for the next read
  eleventyConfig.addFilter("getRandom", function(items, avoid, tags) {
    /*
    this filter assumes items are pages
    we need to loop until we don't pick avoid,
    */

    // Only include posts with similar tags
    const excludes = ["post", "blog", "featured"];
    let myTags = tags.filter(tag => !excludes.includes(tag));
    let myItems = [];
    let selectedTag = "";
    let i = 0;
    if (myTags.length > 0) {
      myTags = shuffleArray(myTags);
      // Loop until we find a tag with more than two items
      while (myItems.length < 2 && i < myTags.length) {
        selectedTag = myTags[i];
        myItems = items.filter(item => item.data.tags.includes(selectedTag));
        i++;
      }
    }
    // If there are not enough items with matching tags, attempt to get a random item
      // from the parent collection so that at least something is recommended.
    if (myItems.length < 2) {
      myItems = items;
    }
    if(!myItems.length || myItems.length < 2) return;

    let selected = myItems[Math.floor(Math.random() * myItems.length)];
    while(selected.url === avoid.url) {
      selected = myItems[Math.floor(Math.random() * myItems.length)];
    }
    return selected;
  });

  // To be used to fetch data for the /random/ page
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
        const excluded = new Set(['post', 'featured', 'author', 'blog']);
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

  // Add collection consistsing of author names
  eleventyConfig.addCollection("authorNames", function(collection) {
    const authorCollection = collection.getFilteredByTag("author");
    return authorCollection.map(author => author.data.name);
  });

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
    let paginationSize = 12;
    let tagMap = [];
    let tagArray = [...tagSet];
    for( let tagName of tagArray) {
      let tagItems = collection.getFilteredByTag(tagName).reverse();
      let pagedItems = lodashChunk(tagItems, paginationSize);
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
