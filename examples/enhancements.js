import { loadComponent, configurePure } from '../dist/pure/js/lazy.js';
const [{ createTagPicker }, { createForm }, { createUpload }, { request }, { createEditor }] = await Promise.all(['tag-picker', 'forms', 'upload', 'ajax', 'editor'].map(name => loadComponent(name)));
const tagPicker = createTagPicker(document.querySelector('#post-tags'), {
  maxTags: 8,
  async fetch(query, { signal }) {
    const tags = await request('tags.json', { type: 'json', signal });
    return tags.filter(tag => tag.label.toLowerCase().includes(query.toLowerCase()));
  },
});
const postForm = document.querySelector('#post-form'); const form = createForm(postForm);
postForm.addEventListener('submit', event => {
  if (event.defaultPrevented) return; event.preventDefault();
  document.querySelector('#tag-values').textContent = JSON.stringify(new FormData(postForm).getAll('tags[]'), null, 2);
});
const prepareFile = async (file, { signal }) => {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return file;
  const { prepareImage } = await loadComponent('image', { styles: false });
  return (await prepareImage(file, { maxWidth: 2560, maxHeight: 2560, maxBytes: 5 * 1024 * 1024, signal })).file;
};
configurePure({ upload: { maxSize: 6 * 1024 * 1024, prepareFile } });
const upload = createUpload(document.querySelector('#photo'));
const uploadImage = async (file, { signal } = {}) => {
  const item = await request('/api/images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file, signal, type: 'json' });
  return { id: item.url, src: item.url };
};
document.querySelector('#image-form').addEventListener('submit', async event => {
  if (event.defaultPrevented) return; event.preventDefault();
  const result = document.querySelector('#image-result'); const file = upload.getFiles()[0];
  if (!file) { result.textContent = 'Choose an image first.'; return; }
  result.textContent = 'Uploading...';
  try { const item = await uploadImage(file); result.textContent = `Uploaded ${file.name} (${file.size} bytes): ${item.src}`; }
  catch (error) { result.textContent = error.message; }
});
const editor = createEditor(document.querySelector('#article'), { features: { images: true }, uploadImage });
await editor.ready;
window.addEventListener('pagehide', () => { editor.destroy(); upload.destroy(); tagPicker.destroy(); form.destroy(); }, { once: true });
