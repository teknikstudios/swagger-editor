// Adapted from https://github.com/mlaursen/react-dd-menu/blob/master/src/js/DropdownMenu.js

/* eslint react/no-find-dom-node: 0 */

import React, { PureComponent, PropTypes } from "react"
import ReactDOM from "react-dom"
import Axios from 'axios';
import CSSTransitionGroup from "react-transition-group/CSSTransitionGroup"
import classnames from "classnames"

const TAB = 9
const SPACEBAR = 32


function Loading(props) {
  const isLoading = props.isLoading;
  if (isLoading) {
    return <h1>Loading</h1>;
  }
  return <h1>NOT Loading</h1>;
}


export default class FileChooser extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    onFileLoaded: React.PropTypes.func,
  };

  static defaultProps = {
    className: null,
    size: null,
    onFileLoaded: function(contents,name,path){}
  };

  constructor(props, context) {
    super(props, context)

    this.state = {
      isLoading: true,
      currentPath: '',
      files: [],
      directories: [],
      fileContents: null
    }
  }

  componentDidMount() {
    this.loadFolder();
  }

  componentDidUpdate(prevProps) {
    if(this.props.isOpen === prevProps.isOpen) {
      return
    }

    const menuItems = ReactDOM.findDOMNode(this).querySelector(".dd-menu > .dd-menu-items")
    if(this.props.isOpen && !prevProps.isOpen) {
    } else if(!this.props.isOpen && prevProps.isOpen) {
    }
  }

  componentWillUnmount() {
    //this.serverRequest.abort();
  }

  loadFolder(name) {
    let path = this.state.currentPath;

    this.setState( { isLoading: true, files: [], directories: [], fileContents: null });

    if (name) {
       path += name + '/';
    }

    Axios.get(this.props.source + path)
      .then(res => {
        const posts = res.data;//.data.children.map(obj => obj.data);
        let directories = [];
        let files = [];
        console.log(posts);
        for (var i=0; i<posts.directories.length; i++) {
          directories.push( { name: posts.directories[i] } );
        }
        for (var i=0; i<posts.files.length; i++) {
          files.push( { name: posts.files[i].name } );
        }
        this.setState( { isLoading: false, directories: directories, files: files, currentPath: path });
        //this.setState({ posts });
      });
  }

  loadFile(name) {
    let path = this.state.currentPath;

    this.setState( { isLoading: true, files: [], directories: [], fileContents: null  });

    if (name) {
       path += name;
    }

    Axios.get(this.props.source + path)
      .then(res => {
        const contents = res.data;//.data.children.map(obj => obj.data);
        let directories = [];
        let files = [];
        console.log(contents);
        this.props.onFileLoaded(contents, name, path);
        this.setState( { isLoading: false, directories: directories, files: files, currentPath: path, fileContents: contents });
      });
  }

  render() {
    const { size, className } = this.props

    const chooserClassName = classnames(
      "dd-chooser",
      className,
      size ? ("dd-chooser-" + size) : null
    )

    //const { textAlign, upwards, animAlign, animate, enterTimeout, leaveTimeout } = this.props

    const listClassName = "dd-chooser-items"//-" + (textAlign || align)

    return (
      <div className={chooserClassName}>
        <Loading isLoading={this.state.isLoading}></Loading>
        <ul key="items" className={listClassName}>
          {this.state.directories.map(child => (
            <li className="station" key={child.name} onClick={this.loadFolder.bind(this, child.name)}>{child.name}</li>
          ))}
          {this.state.files.map(child => (
            <li className="station" key={child.name} onClick={this.loadFile.bind(this, child.name)}>{child.name}</li>
          ))}
        </ul>
      </div>
    )
  }
}
