import { html } from 'common-tags';

function SnippetComponent(post) {
  return html`
    <div>
      <article class="snippet">
        <h5 class="snippet__title">${post.data.title}</h5>
        <img src="${post.data.image}" alt="poem cover image" class="snippet__image">
        <p class="snippet__meta">
          by <span>${post.data.author}</span> on <span>${post.data.date}</span>
        </p>
        <p class="snippet__body">${post.templateContent.length > 100
          ? `${post.templateContent.substring(0, 100)}...`
          : post.templateContent}</p>
        <a href="${post.url}" class="btn btn--primary">Continue Reading</a>
      </article>
    </div>
  `;
}
/* TO WORK ON SNIPPET */

export default SnippetComponent;
