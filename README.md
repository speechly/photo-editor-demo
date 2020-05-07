
## Speechly photo editor example

[![License](http://img.shields.io/:license-mit-blue.svg)](LICENSE)

This is an simple photo editing application which can edit the brightness, add and remove filters and crop images, using voice.

Built with:
- [speechly-browser-client](https://github.com/speechly/browser-client)
- [create-react-app](https://github.com/facebook/create-react-app)
- [tui.image-editor](https://github.com/nhn/tui.image-editor)

You can check it out at https://speechly.github.io/photo_editor_demo/

## Development

```bash
npm install

# Configure your Speechly app ID
export REACT_APP_APP_ID="your-app-id"
# Configure your Speechly app language
export REACT_APP_LANGUAGE="your-app-language"

# Open http://localhost:3000 to view it in the browser.
npm run start
```