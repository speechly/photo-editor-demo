// @ts-nocheck
import classNames from "classnames";
import React from "react";
import { ClientState } from "@speechly/browser-client";
import CircularProgress from "@material-ui/core/CircularProgress";
import ImageEditor from 'tui-image-editor';

type MicProps = {
  onDown: (event: any) => void;
  onUp: (event: any) => void;
  clientState?: ClientState;
  imageEditor: ImageEditor;
};
// As we need to prevent browser default behavior on touch start/event events, we need to do some tricky stuff
// because of: https://github.com/facebook/react/issues/8968

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
let passiveSupported = false;
try {
  const options = {
    get passive() {
      // This function will be called when the browser
      //   attempts to access the passive property.
      passiveSupported = true;
      return passiveSupported;
    }
  };

  // @ts-ignore
  window.addEventListener("test", options, options);
  // @ts-ignore
  window.removeEventListener("test", options, options);
} catch (err) {
  passiveSupported = false;
}

export class Mic extends React.Component<MicProps, {}> {
  rootDiv: React.RefObject<HTMLDivElement>;
  constructor(props: MicProps) {
    super(props);
    this.rootDiv = React.createRef<HTMLDivElement>();
  }

  spaceBar = (e: any, cb: Function) => {
    e = e || window.event;
    e.preventDefault();
    if (e.keyCode === 32 && !e.repeat) {
      cb(e);
    }
  };

  onSpaceBarDown = (e: any) => this.spaceBar(e, this.onDown);

  onSpaceBarUp = (e: any) => this.spaceBar(e, this.onUp);

  onDown = (e: any) => {
    // editor.crop({
    //   left: 10,
    //   top: 10,
    //   width: 1000,
    //   height: 1000
    // });
    //debugger
    //editor.applyFilter('Sharpen');
    //editor.applyFilter("brightness", { brightness: 0.3})
    // editor.applyFilter('removeWhite', {
    //   threshold: 10,
    //   distance: 6
    // }).then(obj => {
    //   console.log('filterType: ', obj.type);
    //   console.log('actType: ', obj.action);
    // }).catch(message => {
    //     console.log('error: ', message);
    // });
    //editor.applyFilter('mask', {maskObjId: 0}).then(obj => {
    //  console.log('filterType: ', obj.type);
    //  console.log('actType: ', obj.action);
    //}).catch(message => {
    //    console.log('error: ', message);
    //});
    // prevent initiating listening when the browser-client is not connected
    if (this.props.clientState === ClientState.Connected) {
      this.props.onDown(e);
    }
  };

  onUp = (e: any) => {
    if (this.props.clientState && this.props.clientState === ClientState.Recording) {
      this.props.onUp(e);
    }
  };

  componentDidMount() {
    if (this.rootDiv.current) {
      const addEventListener = (event: any, fn: any) =>
        this.rootDiv.current!.addEventListener(event, fn, passiveSupported ? { passive: false } : false);
      addEventListener("touchstart", this.onDown);
      addEventListener("touchend", this.onUp);
      addEventListener("mousedown", this.onDown);
      addEventListener("mouseup", this.onUp);
    }

    document.addEventListener("keydown", this.onSpaceBarDown);
    document.addEventListener("keyup", this.onSpaceBarUp);
  }

  componentWillUnmount() {
    if (this.rootDiv.current) {
      this.rootDiv.current.removeEventListener("touchstart", this.onDown);
      this.rootDiv.current.removeEventListener("touchend", this.onUp);
      this.rootDiv.current.removeEventListener("mousedown", this.onDown);
      this.rootDiv.current.removeEventListener("mouseup", this.onUp);
    }

    document.removeEventListener("keydown", this.onSpaceBarDown);
    document.removeEventListener("keyup", this.onSpaceBarUp);
  }

  renderMicrophone = () => (
    <object>
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" tabIndex={0} viewBox="-2 -2 24 24">
        <circle stroke="#d8dfe6" strokeWidth="0.5" cx="10" cy="10" r="15" fill="#ffffff" />
        <path d="M10 10" />
        <path
          transform="translate(2,2) scale(0.8)"
          x="10"
          y="10"
          d="M9 18v-1.06A8 8 0 0 1 2 9h2a6 6 0 1 0 12 0h2a8 8 0 0 1-7 7.94V18h3v2H6v-2h3zM6 4a4 4 0 1 1 8 0v5a4 4 0 1 1-8 0V4z"
        />
      </svg>
    </object>
  );

  render() {
    const isClientReady =
      this.props.clientState &&
      [ClientState.Connected, ClientState.Recording, ClientState.Starting, ClientState.Stopping].includes(
        this.props.clientState
      );
    // const isClientReady = true;

    const className = classNames(
      "function-button",
      "function-button__small",
      {
        "function-button__active":
          this.props.clientState !== undefined &&
          [ClientState.Connecting, ClientState.Connected, ClientState.Stopping].includes(this.props.clientState)
      },
      {
        "function-button__active-pressed": this.props.clientState === ClientState.Recording
      }
    );

    return (
      <div className={className} id="mic-btn" ref={this.rootDiv}>
        {isClientReady ? this.renderMicrophone() : <CircularProgress />}
      </div>
    );
  }
}
