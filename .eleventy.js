const markdownIt = require("markdown-it");
const lodashChunk = require('lodash.chunk');
const { htmlToText } = require('html-to-text');
const fs = require('fs');
const path = require('path');

/**
 * This array contains special tags that reference names of collections. It is used
 * in areas where we want to select only additional tags related to topics.
 */
const specialTags = ['post', 'featured', 'author', 'blog', 'swahili']

function getRandomInt(min, max) {
  // Ensure min and max are inclusive
  min = Math.ceil(min);
  max = Math.floor(max);
  // Generate the random integer
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get a random file name from a directory
function getRandomFileName(dirPath) {
  // Read the directory
  const files = fs.readdirSync(dirPath);

  const filteredFiles = files.filter(file => fs.lstatSync(path.join(dirPath, file)).isFile());

  if (filteredFiles.length === 0) {
    throw new Error('No files found in the directory.');
  }

  // Select a random file
  const randomFile = filteredFiles[Math.floor(Math.random() * filteredFiles.length)];
  return randomFile;
}

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

  // Remove all HTML tags from text: "<p>hey</p>"" becomes "hey"
  // source: https://stackoverflow.com/questions/295566/sanitize-rewrite-html-on-the-client-side/430240#430240
  eleventyConfig.addFilter("removeHTMLTags", function(html) {
    const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
    const tagOrComment = new RegExp(
        '<(?:'
        // Comment body.
        + '!--(?:(?:-*[^->])*--+|-?)'
        // Special "raw text" elements whose content should be elided.
        + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
        + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
        // Regular name
        + '|/?[a-z]'
        + tagBody
        + ')>',
        'gi');
    let oldHtml;
    do {
      oldHtml = html;
      html = html.replace(tagOrComment, '');
    } while (html !== oldHtml);
    return html.replace(/</g, '&lt;');
  });

  /**
   * Return a default random image from the random image directory
   * if the image has not been specified.
   */
  eleventyConfig.addFilter("getDefaultImage2", function(image) {
    if (image === undefined) {
      try {
        const fileName = getRandomFileName("./src/assets/images/random");
        const f = path.join("/assets/images/random", fileName);
        return f;
      } catch (error) {
        console.error("Error while getting random image:", error.message);
      }
    }
    return image;
    });

  /**
   * Return a default random image from picsum if the image has not been specified.
   */
  eleventyConfig.addFilter("getDefaultImage", function(image) {
    if (image) {
      return image;
    }
    const randInt = getRandomInt(1, 100000);
    return `https://picsum.photos/seed/${randInt}/540/370`
  });

  // Extract text from html markup
  eleventyConfig.addFilter("toPlainText", function(html) {
    return htmlToText(html, { wordwrap: false }).replace(/[\r\n]+/g, ' ');;
  });

  // To be used to get a recommendation for the next read
  eleventyConfig.addFilter("getRandom", function(items, avoid, tags, swahili=false) {
    /*
    this filter assumes items are pages
    we need to loop until we don't pick avoid,
    */

    // Only include posts with similar tags;
    let myTags = [];
    if (swahili) {
      myTags = ['swahili'];
    }
    else {
      myTags = tags.filter(tag => !specialTags.includes(tag));
    }
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
        const excluded = new Set(specialTags);
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

  eleventyConfig.addCollection("randomizedPoems", function(collection) {
    const postCollection = collection.getFilteredByTag("post");
    return shuffleArray(postCollection);
  });

  eleventyConfig.addCollection("randomizedSwahiliPoems", function(collection) {
    const shairi = collection.getFilteredByTag("swahili");
    return shuffleArray(shairi);
  });

  // A collection composed of items that count as articles, i.e. whose content
  // can be used to generate previews when sharing their links on social media.
  eleventyConfig.addCollection("articles", function(collection) {
    const articles = collection.getFilteredByGlob("**/*.md");
    return articles;
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
        const excluded = new Set(specialTags);
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
