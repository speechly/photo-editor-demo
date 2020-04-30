import classNames from "classnames";
import React from "react";
import { ClientState } from "@speechly/browser-client";
import { CircularProgress, Button } from "@material-ui/core";

// As we need to prevent browser default behavior on touch start/event events, we need to do some tricky stuff
// because of: https://github.com/facebook/react/issues/8968
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
let passiveSupported = false;
try {
  const options = {
    get passive() {
      // This function will be called when the browser attempts to access the passive property.
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

interface MicProps {
  onDown: EventListener;
  onUp: EventListener;
  onUnmount: () => void;
  clientState: ClientState;
  classNames: string;
}

export class Mic extends React.Component<MicProps, {}> {
  private readonly rootDiv: React.RefObject<HTMLDivElement>;
  private readonly onKeyUp: EventListener;
  private readonly onKeyDown: EventListener;
  private readonly onUnmount: () => void;

  constructor(props: MicProps) {
    super(props);

    this.rootDiv = React.createRef<HTMLDivElement>();
    this.onKeyDown = props.onDown;
    this.onKeyUp = props.onUp;
    this.onUnmount = props.onUnmount;
  }

  private addEventListener(event: string, cb: EventListener) {
    if (this.rootDiv.current === null) {
      return;
    }

    this.rootDiv.current.addEventListener(event, cb, passiveSupported ? { passive: false } : false);
  }

  private removeEventListener(event: string, cb: EventListener) {
    if (this.rootDiv.current === null) {
      return;
    }

    this.rootDiv.current.removeEventListener(event, cb);
  }

  componentDidMount() {
    document.onkeydown = e => handleSpacebar(e, this.onKeyDown);
    document.onkeyup = e => handleSpacebar(e, this.onKeyUp);

    this.addEventListener("touchstart", this.onKeyDown);
    this.addEventListener("touchend", this.onKeyUp);
    this.addEventListener("mousedown", this.onKeyDown);
    this.addEventListener("mouseup", this.onKeyUp);
  }

  componentWillUnmount() {
    document.onkeydown = null;
    document.onkeyup = null;

    this.removeEventListener("touchstart", this.onKeyDown);
    this.removeEventListener("touchend", this.onKeyUp);
    this.removeEventListener("mousedown", this.onKeyDown);
    this.removeEventListener("mouseup", this.onKeyUp);

    this.onUnmount();
  }

  render() {
    const clientConnecting = this.props.clientState === ClientState.Connecting;
    const clientConnected = this.props.clientState >= ClientState.Connected;

    const rootClassName = `Microphone ${this.props.classNames}`;

    const micClassName = classNames("Microphone__button", {
      hidden: !clientConnected,
      Microphone__button__active: this.props.clientState === ClientState.Recording,
      Microphone__button__inactive: this.props.clientState === ClientState.Stopping
    });

    const helpClassName = classNames("Microphone__help", "HelpText", {
      hidden: !clientConnected
    });

    return (
      <div className={rootClassName} ref={this.rootDiv}>
        <div style={{height: '50px'}}></div>
        {clientConnecting && <CircularProgress size="3vh" className="Microphone__loading" />}
        <div className={micClassName}>
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
        </div>
        <div className={helpClassName}>Press and hold space bar to talk</div>
      </div>
    );
  }
}

function handleSpacebar(e: KeyboardEvent, cb: EventListener) {
  if (e.keyCode === 32) {
    e.preventDefault();
    cb(e);
  }
}