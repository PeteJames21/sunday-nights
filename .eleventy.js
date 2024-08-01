const markdownIt = require("markdown-it");

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

  return {
    dir: {
      input: "src",
      output: "public"
    }
  };
}
