// Adapted from https://github.com/mlaursen/react-dd-menu/blob/master/src/js/DropdownMenu.js

/* eslint react/no-find-dom-node: 0 */

import React, { PureComponent, PropTypes } from "react"
import ReactDOM from "react-dom"
import Axios from 'axios';
import CSSTransitionGroup from "react-transition-group/CSSTransitionGroup"
import classnames from "classnames"

const FILE_MODES = ["open","save","saveas"]

function Loading(props) {
  const isLoading = props.isLoading;
  if (isLoading) {
    return <h3>Loading files and directoriess</h3>;
  }
  return null;
}

export default class SaveFileAs extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    root: PropTypes.string,
    contents: PropTypes.string,
    onSave: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    onFileLoaded: React.PropTypes.func,
    mode: PropTypes.oneOf(FILE_MODES),
  };

  static defaultProps = {
    className: null,
    size: null,
    root: null,
    contents: '',
    onFileLoaded: function(contents,name,path){},
    onSave: function(filepath){},
    onCancel: function(){},
    mode: 'open'
  };

  static FILE_MODES = FILE_MODES;

  /*
   constructor
  */
  constructor(props, context) {
    super(props, context)

    let { root } = this.props

    var rootCurrentDirectory = root.replace(/.*?([^\/]*)\/$/g, '$1');

    root = root.replace(/^\/*(.*?)(\/?)(\/*?)$/g, '$1$2');

    this.state = {
      isLoading: true,
      rootPath: root,
      rootCurrentDirectory: rootCurrentDirectory,
      newDirectoryFormVisible: false,
      creatingNewDirectory: false,
      currentDirectoryActionMenuOpen: false,
      currentDirectoryActionsWidth: 0,
      editingCurrentDirectory: false,
      editedCurrentDirectoryName: '',
      newDirectoryName: '',
      saveAsFileName: '',
      breadcrumb: [],
      files: [],
      directories: []
    }
  }

  /*
   componentDidMount
  */
  componentDidMount() {
    this.loadDirectory();
  }

  /*
   componentDidUpdate
  */
  componentDidUpdate(prevProps) {
    if(this.props.isOpen === prevProps.isOpen) {
      return
    }

    const menuItems = ReactDOM.findDOMNode(this).querySelector(".dd-menu > .dd-menu-items")
    if(this.props.isOpen && !prevProps.isOpen) {
    } else if(!this.props.isOpen && prevProps.isOpen) {
    }
  }

  /*
   componentWillUnmount
  */
  componentWillUnmount() {
    //this.serverRequest.abort();
  }

  /*
   loadParentDirectory
  */
  loadParentDirectory() {
    let { breadcrumb } = this.state;

    if (breadcrumb.length == 0) {
      return;
    }

    if (breadcrumb.length == 1) {
      this.loadDirectory();
      return;
    }

    let currentDirectory = breadcrumb.pop();
    let parentDirectory = breadcrumb.pop();
    this.loadDirectory(parentDirectory);
  }

  loadFile(name) {
    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    this.setState( {
      isLoading: true,
      files: [],
      directories: [],
      creatingNewDirectory: false,
      newDirectoryName: '',
      newDirectoryFormVisible: false,
      editedCurrentDirectoryName: '',
      editingCurrentDirectory: false,
      currentDirectoryActionMenuOpen: false,
    });

    let newPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + name;

    fetch(this.props.source + newPath, {credentials: 'include'})
      .then(response => {
        return response.text()
      })
      .then(data => {
        console.log('Request succeeded with JSON response', data);
        this.props.onFileLoaded(data, name, newPath);
        this.setState( { isLoading: false, directories: [], files: [], breadcrumb: [] });
      })
      .catch(function (error) {
        console.log('Request failed', error);
        alert('Error loading file');
      });
  }

  /*
   loadDirectory
  */
  loadDirectory(name) {
    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    this.setState( {
      isLoading: true,
      files: [],
      directories: [],
      creatingNewDirectory: false,
      newDirectoryName: '',
      newDirectoryFormVisible: false,
      editedCurrentDirectoryName: '',
      editingCurrentDirectory: false,
      currentDirectoryActionMenuOpen: false,
    });

    if (!name) {
      // Loading the root Directory
      breadcrumb = [];
    }

    let newPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + (name ? (name + '/') : '');

    Axios.get(this.props.source + newPath)
      .then(res => {
        console.log(res);
        const posts = res.data;//.data.children.map(obj => obj.data);
        let directories = [];
        let files = [];

        for (var i=0; i<posts.directories.length; i++) {
          directories.push( { name: posts.directories[i], editing: false, actionsOpen: false, editedDirectoryName: '' } );
        }
        for (var i=0; i<posts.files.length; i++) {
          files.push( { name: posts.files[i].name, editing: false, actionsOpen: false, editedFileName: '' } );
        }

        if (name) {
          breadcrumb.push(name);
        }

        this.setState( { isLoading: false, directories: directories, files: files, breadcrumb: breadcrumb });
      })
      .catch(error => {
        this.setState( { isLoading: false, directories: directories, files: files, newDirectoryFormVisible: false, newDirectoryName: '' });
      });
  }

  /*
   showNewDirectoryForm
  */
  showNewDirectoryForm = () => {
    this.setState({newDirectoryFormVisible: true, newDirectoryName: '',editedCurrentDirectoryName: '', editingCurrentDirectory: false, currentDirectoryActionMenuOpen: false})
  }

  /*
   hideNewDirectoryForm
  */
  hideNewDirectoryForm = () => {
    this.setState({newDirectoryFormVisible: false, newDirectoryName: ''})
  }

  /*
   hideNewDirectoryForm
  */
  onFileSaved() {
    const { saveAsFileName, breadcrumb, rootPath } = this.state;

    if (saveAsFileName.length <= 0) {
      alert('Filename is required');
      return;
    }

    const newFilePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + saveAsFileName;

    fetch('http://localhost:3000/svn/' + newFilePath, {
        method: 'post',
        credentials: 'include',
        headers: {
          "Content-type": "text/plain; charset=UTF-8"
        },
        body: this.props.contents
      })
      //.then(status)
      //.then(json)
      .then(data => {
        console.log('Request succeeded with JSON response', data);
        this.props.onSave(this.props.contents, saveAsFileName, newFilePath);
      })
      .catch(function (error) {
        console.log('Request failed', error);
        alert('Error saving file');
      });

  }

  /*
   createNewDirectory
  */
  createNewDirectory() {
    const { newDirectoryName, breadcrumb, rootPath } = this.state

    if (newDirectoryName.length <= 0) {
      alert('Provide a directory name');
      return;
    }

    //this.setState( { isLoading: true, files: [], directories: [] });
    this.setState({ creatingNewDirectory: true })

    const newDirectoryPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + newDirectoryName + '/';

    Axios.post(this.props.source + newDirectoryPath)
      .then(res => {
        this.setState({ creatingNewDirectory: false, newDirectoryName: '', newDirectoryFormVisible: false })
        this.loadDirectory(newDirectoryName);
      }).catch(err => {
        alert('Error creating new directory');
        this.setState({ creatingNewDirectory: false, newDirectoryName: '', newDirectoryFormVisible: false })
      });
  }

  /*
   updateNewDirectoryNameValue
  */
  updateNewDirectoryNameValue(evt) {
    this.setState({
      newDirectoryName: evt.target.value
    });
  }

  /*
   editDirectoryNameValue
  */
  editDirectoryNameValue(directory, evt) {
    let { directories } = this.state;

    for (var idx in directories) {
      if (directories[idx] == directory) {
        directories[idx].editedDirectoryName = evt.target.value;
        this.setState({directories: directories});
        return;
      }
    }
  }

  /*
   editFileNameValue
  */
  editFileNameValue(file, evt) {
    let { files } = this.state;

    for (var idx in files) {
      if (files[idx] == file) {
        files[idx].editedFileName = evt.target.value;
        this.setState({files: files});
        return;
      }
    }
  }

  /*
   updateSaveAsFileNameValue
  */
  updateSaveAsFileNameValue(evt) {
    this.setState({
      saveAsFileName: evt.target.value
    });
  }

  closeAllActionMenus(options, evt) {
    let { directories,files } = this.state;


    for (var idx in directories) {
      if (options && options.toggleDirectory && options.toggleDirectory == directories[idx]) {
        directories[idx].actionsOpen = !directories[idx].actionsOpen;
        directories[idx].actionsWidth = 30;
        if (evt && evt.currentTarget && evt.currentTarget.parentElement) {
          directories[idx].actionsWidth = ReactDOM.findDOMNode(evt.currentTarget.parentElement).querySelector('.actions').offsetWidth;
        }
      } else {
        directories[idx].actionsOpen = false;
      }
    }

    for (var idx in files) {
      if (options && options.toggleFile && options.toggleFile == files[idx]) {
        files[idx].actionsOpen = !files[idx].actionsOpen;
        files[idx].actionsWidth = 30;
        if (evt && evt.currentTarget && evt.currentTarget.parentElement) {
          files[idx].actionsWidth = ReactDOM.findDOMNode(evt.currentTarget.parentElement).querySelector('.actions').offsetWidth;
        }
      } else {
        files[idx].actionsOpen = false;
      }
    }

    this.setState({directories: directories, files: files, currentDirectoryActionMenuOpen: false});
  }

  getDirectoryIdx(directory) {
    for (var idx in this.state.directories) {
      if (this.state.directories[idx] == directory) {
        return idx;
      }
    }
    return null;
  }

  deleteDirectory(directory, evt) {
    evt.stopPropagation();

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    let filePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + directory.name + '/';

    fetch(this.props.source + filePath, {
        method: 'delete',
        credentials: 'include',
      })
      .then(response => {
        return response.text()
      })
      .then(data => {
        console.log('Request succeeded with JSON response', data);
      })
      .catch(function (error) {
        console.log('Request failed', error);
        alert('Error deleting directory');
      });

  }


  editDirectory(directory, evt) {
    evt.stopPropagation();
    this.closeAllActionMenus();

    try {
      let { directories } = this.state;
      let idx = this.getDirectoryIdx(directory);
      directories[idx].editedDirectoryName = directories[idx].name;
      directories[idx].editing = true;
      this.setState({directories: directories});
    } catch (e) {
      alert('Error editing directory');
    }
  }

  cancelEditDirectory(directory, evt) {
    evt.stopPropagation();

    try {
      let { directories } = this.state;
      let idx = this.getDirectoryIdx(directory);
      directories[idx].editedDirectoryName = '';
      directories[idx].editing = false;
      directories[idx].actionsOpen = false;
      this.setState({directories: directories});
    } catch (e) {
      //alert('Error canceling');
    }
  }

  saveEditDirectory(directory, evt) {
    evt.stopPropagation();

    try {
      let { directories } = this.state;
      let idx = this.getDirectoryIdx(directory);
      directories[idx].editing = false;
      directories[idx].actionsOpen = false;
      this.setState({directories: directories});
    } catch (e) {
      alert('Error editing directory');
    }
  }



  editFile(file, evt) {
    evt.stopPropagation();
    let { files } = this.state;
    for (var idx in files) {
      if (files[idx] == file) {
        files[idx].editedFileName = files[idx].name;
        files[idx].editing = true;
        files[idx].actionsOpen = false;
        this.setState({files: files});
        return;
      }
    }
  }

  cancelEditFile(file, evt) {
    evt.stopPropagation();
    let { files } = this.state;
    for (var idx in files) {
      if (files[idx] == file) {
        files[idx].editedFileName = '';
        files[idx].editing = false;
        files[idx].actionsOpen = false;
        this.setState({files: files});
        return;
      }
    }
  }

  saveEditFile(file, evt) {
    evt.stopPropagation();
    let { files } = this.state;
    for (var idx in files) {
      if (files[idx] == file) {
        files[idx].editing = false;
        files[idx].actionsOpen = false;
        this.setState({files: files});
        return;
      }
    }
  }

  deleteFile(file, evt) {
    evt.stopPropagation();

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    let filePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + file.name;

    fetch(this.props.source + filePath, {
        method: 'delete',
        credentials: 'include',
      })
      .then(response => {
        return response.text()
      })
      .then(data => {
        console.log('Request succeeded with JSON response', data);
      })
      .catch(function (error) {
        console.log('Request failed', error);
        alert('Error deleting file');
      });
  }



  toggleCurrentDirectoryActionMenu(evt) {
    this.closeAllActionMenus();
    this.setState({currentDirectoryActionMenuOpen: !this.state.currentDirectoryActionMenuOpen, currentDirectoryActionsWidth: ReactDOM.findDOMNode(evt.currentTarget.parentElement).querySelector('.actions').offsetWidth });
  }

  editCurrentDirectoryNameValue(evt) {
    this.setState({
      editedCurrentDirectoryName: evt.target.value
    });
  }

  editCurrentDirectory(evt) {
    const {breadcrumb} = this.state;
    evt.stopPropagation();
    this.setState({editedCurrentDirectoryName: breadcrumb[breadcrumb.length - 1], editingCurrentDirectory: true, currentDirectoryActionMenuOpen: false});
  }

  cancelEditCurrentDirectory(evt) {
    evt.stopPropagation();
    this.setState({editedCurrentDirectoryName: '', editingCurrentDirectory: false, currentDirectoryActionMenuOpen: false});
  }

  saveEditCurrentDirectory(evt) {
    evt.stopPropagation();
    this.setState({editingCurrentDirectory: false, currentDirectoryActionMenuOpen: false});
  }

  deleteCurrentDirectory() {
    const {breadcrumb} = this.state;
    this.setState({editedCurrentDirectoryName: breadcrumb[breadcrumb.length - 1], editingCurrentDirectory: true, currentDirectoryActionMenuOpen: false});
  }


  /*
   render
  */
  render() {
    const { size, className } = this.props
    const { breadcrumb, newDirectoryFormVisible, creatingNewDirectory, currentDirectoryActionMenuOpen, editingCurrentDirectory, editedCurrentDirectoryName, currentDirectoryActionsWidth } = this.state

    const chooserClassName = classnames(
      "file-chooser",
      className,
      size ? ("dd-chooser-" + size) : null
    )

    //const { textAlign, upwards, animAlign, animate, enterTimeout, leaveTimeout } = this.props

    const listClassName = "file-chooser-items"//-" + (textAlign || align)
    const browserClassName = "file-browser"

    var newDirectoryFormStyle = {
      borderBottom:"solid 1px #cacaca",
      marginBottom:"20px",
      paddingBottom:"15px",
      display:(newDirectoryFormVisible ? 'block' : 'none')
    }

    return (
      <div className="container">

        <div className={chooserClassName} style={{margin: "1em"}}>
          { this.props.mode == 'open' ? <h1>Open file...</h1> : null }
          { this.props.mode == 'save' ? <h1>Save file...</h1> : null }
          { this.props.mode == 'saveas' ? <h1>Save file as...</h1> : null }
          <div className="current-directory" style={{overflow:"hidden",position:"relative",display:(this.state.isLoading ? 'none' : 'block')}}>
            <span className="actions">
              <button className="btn new-btn" onClick={evt => {this.showNewDirectoryForm(evt)}}></button>
              { breadcrumb.length > 0 ? <button className="btn edit-btn" onClick={evt => {this.editCurrentDirectory(evt)}}></button> : null }
              { breadcrumb.length > 0 ? <button className="btn delete-btn" onClick={evt => {this.deleteCurrentDirectory(evt)}}></button> : null }
            </span>
            <h2 className="label" style={{left: currentDirectoryActionMenuOpen ? ((currentDirectoryActionsWidth + 45) + 'px') : '30px'}}>{
                breadcrumb.length > 0 ?
                  (editingCurrentDirectory == false ?
                    breadcrumb[breadcrumb.length - 1] :
                    (<div className="input-group">
                      <input type="text" value={editedCurrentDirectoryName} onChange={evt => {this.editCurrentDirectoryNameValue(evt) }} />
                      <div className="input-group-btn">
                        <button onClick={evt => {this.cancelEditCurrentDirectory(evt) }}>Cancel</button>
                        <button onClick={evt => {this.saveEditCurrentDirectory(evt) }}>Save</button>
                      </div>
                    </div>)
                  ) : "Files & Directories"
                }
            </h2>
            <button className="menu-btn" onClick={evt => {this.toggleCurrentDirectoryActionMenu(evt)}}></button>
          </div>

          <div style={newDirectoryFormStyle}>
            <input type="text" placeholder="New directory name" value={this.state.newDirectoryName} onChange={this.updateNewDirectoryNameValue.bind(this)} style={{display: "block", fontSize: "1.3em", padding: "8px 12px", width: "100%", border: "solid 1px #797979", borderRadius: "0", margin: "10px 0" }}/>
            <button className="btn cancel" style={{marginLeft: "0", width:"48%"}} disabled={creatingNewDirectory} onClick={this.hideNewDirectoryForm}>Cancel</button>
            <button className="btn" style={{marginLeft: "4%", width:"48%"}} disabled={creatingNewDirectory} onClick={this.createNewDirectory.bind(this)}>Create Directory</button>
          </div>
          <div className={browserClassName}>
            <Loading isLoading={this.state.isLoading}></Loading>
            <ul key="items" className={listClassName} style={{margin:"0",padding:"0",listStyle:"none"}}>
              { (this.state.breadcrumb.length > 0 && this.state.isLoading == false) ? <li className="directory" onClick={this.loadParentDirectory.bind(this)}>Up one directory</li> : null }
              {this.state.directories.map(child => (
                <li key={child.name} className="directory">
                  <span className="actions">
                    <button className="btn edit-btn" onClick={evt => { this.editDirectory(child,evt) } }></button>
                    <button className="btn delete-btn" onClick={evt => { this.deleteDirectory(child, evt) } }></button>
                  </span>
                  <span className="label" style={{left: child.actionsOpen ? ((child.actionsWidth + 45)+'px') : '30px'}} onClick={e => { if (child.editing == false) { this.loadDirectory(child.name) } }}>{
                    child.editing == false ?
                      (child.name) :
                      (<div className="input-group">
                        <input type="text" value={child.editedDirectoryName} onChange={evt => { this.editDirectoryNameValue(child,evt); }} />
                        <div className="input-group-btn">
                          <button onClick={evt => { this.cancelEditDirectory(child, evt)} }>Cancel</button>
                          <button onClick={evt => { this.saveEditDirectory(child, evt)} }>Save</button>
                        </div>
                      </div>)
                  }</span>
                  <button className="menu-btn" onClick={evt => { this.closeAllActionMenus({toggleDirectory:child}, evt); }}></button>

                </li>
              ))}
              {this.state.files.map(child => (
                <li key={child.name} className="file">
                  <span className="actions">
                    <button className="btn edit-btn" onClick={evt => { this.editFile(child,evt) } }></button>
                    <button className="btn delete-btn" onClick={evt => { this.deleteFile(child, evt) } }></button>
                  </span>
                  <span className="label" style={{left: child.actionsOpen ? ((child.actionsWidth+45)+'px') : '30px'}} onClick={e => { if (this.props.mode == 'open') { this.loadFile(child.name) } }}>{
                    child.editing == false ?
                      (child.name) :
                      (<div className="input-group">
                        <input type="text" value={child.editedFileName} onChange={evt => { this.editFileNameValue(child,evt); }} />
                        <div className="input-group-btn">
                          <button onClick={evt => { this.cancelEditFile(child, evt)} }>Cancel</button>
                          <button onClick={evt => { this.saveEditFile(child, evt)} }>Save</button>
                        </div>
                      </div>)
                  }</span>
                  <button className="menu-btn" onClick={evt => { this.closeAllActionMenus({toggleFile:child}, evt); }}></button>
                </li>
              ))}
            </ul>
          </div>
          {this.props.mode != 'open' ? <input disabled={creatingNewDirectory || this.state.isLoading} type="text" placeholder="Filename" ref="filenameInput" value={this.state.saveAsFileName} onChange={this.updateSaveAsFileNameValue.bind(this)} style={{display: "block", fontSize: "1.3em", padding: "8px 12px", width: "100%", border: "solid 1px #797979", borderRadius: "0", margin: "20px 0 10px 0" }}/> : null}
        </div>
        <div className="right" style={{paddingTop: "15px", marginTop: "10px",borderTop: "solid 1px #d4d4d4"}}>
          <button disabled={creatingNewDirectory || this.state.isLoading} className="btn cancel" onClick={this.props.onCancel}>Cancel</button>
          { this.props.mode == 'save' ? (<button disabled={creatingNewDirectory || this.state.isLoading} className="btn" onClick={this.onFileSaved.bind(this)}>Save</button>) : null }
          { this.props.mode == 'saveas' ? (<button disabled={creatingNewDirectory || this.state.isLoading} className="btn" onClick={this.onFileSaved.bind(this)}>Save</button>) : null }
        </div>
      </div>
    )
  }
}
