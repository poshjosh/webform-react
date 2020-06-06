'use strict';

import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import ReactDOM from "react-dom";

import Form from "./form";

/*
 *  React Router keeps the URL up to date as you navigate
 *  through the site. This preserves the browser history,
 *  making sure things like the back button and bookmarks
 *  work properly
 * 
 *  A <Switch> looks through all its children <Route>
 *  elements and renders the first one whose path
 *  matches the current URL. Use a <Switch> any time
 *  you have multiple routes, but you want only one
 *  of them to render at a time
 */
class App extends React.Component {
    render() {
        return (
          <Router>
            <div>
              <Switch>
                <Route exact path="/">
                  <Home />
                </Route>
                <Route path="/create/blog">
                  <Form basepath="/forms" action="create" modelname="blog"/>
                </Route>
                <Route path="/create/post">
                  <Form basepath="/forms" action="create" modelname="post"/>
                </Route>
                <Route path="/create/tag">
                  <Form basepath="/forms" action="create" modelname="tag"/>
                </Route>
              </Switch>
            </div>
          </Router>
        );
    }
};

function Home() {
    return (
        <div>
            <h3>Webforms + React</h3>
            <p>
                This application demonstrates the versatility of Webforms
                with a React based front end. Using Webforms, forms are
                automatically generated for your web application based on
                annotations defined on your domain objects.
            </p>
            <p>
                Click any of the links below to see Webforms in action.
            </p>
            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/create/blog">Create Blog</Link>
                </li>
                <li>
                    <Link to="/create/post">Create Post</Link>
                </li>
                <li>
                    <Link to="/create/tag">Create Tag</Link>
                </li>
            </ul>
        </div>
    );
}

ReactDOM.render(
	<App/>,
	document.getElementById('react')
);
