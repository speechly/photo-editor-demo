## Speechly photo editor example

[![License](http://img.shields.io/:license-mit-blue.svg)](LICENSE)

This is an simple photo editing application which can edit the brightness, add and remove filters and crop images by using voice. You can follow [our tutorial](https://www.speechly.com/blog/building-a-web-application-with-a-voice-user-interface/?utm_source=github&utm_medium=photo-editor&utm_campaign=text) to see how this was built.

Built with:
- [speechly-browser-client](https://github.com/speechly/browser-client)
- [create-react-app](https://github.com/facebook/create-react-app)
- [fabricjs](http://fabricjs.com)

You can check it out at https://speechly.github.io/photo-editor-demo/ 

## About Speechly

Speechly is a developer tool for building real-time multimodal voice user interfaces. It enables developers and designers to enhance their current touch user interface with voice functionalities for better user experience. Speechly key features:

#### Speechly key features

- Fully streaming API
- Multi modal from the ground up
- Easy to configure for any use case
- Fast to integrate to any touch screen application
- Supports natural corrections such as "Show me red – i mean blue t-shirts"
- Real time visual feedback encourages users to go on with their voice

| Example application | Description |
| :---: | --- |
| <img src="https://i.imgur.com/v9o1JHf.gif" width=50%> | Instead of using buttons, input fields and dropdowns, Speechly enables users to interact with the application by using voice. <br />User gets real-time visual feedback on the form as they speak and are encouraged to go on. If there's an error, the user can either correct it by using traditional touch user interface or by voice. |

Want to build something like this? Sign up to our wait list on [Speechly website](https://www.speechly.com/?utm_source=github&utm_medium=photo-editor&utm_campaign=text) and read our [documentation](https://www.speechly.com/docs/?utm_source=github&utm_medium=photo-editor&utm_campaign=text) to learn more!

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
