import "./Styles.scss";
import React from "react";
import 'tui-image-editor/dist/tui-image-editor.css';
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import Editor from "./Editor";
import Onboard from "./Onboard";
  
const App = () => {

    return (
        <div>
            <Router>
                <Switch>
                    <Route exact path="/" component={Onboard} />
                    <Route exact path="/edit" component={Editor} />
                </Switch>
            </Router>
        </div>
    );
};

export default App;