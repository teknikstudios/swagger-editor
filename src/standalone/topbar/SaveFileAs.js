// Adapted from https://github.com/mlaursen/react-dd-menu/blob/master/src/js/DropdownMenu.js

/* eslint react/no-find-dom-node: 0 */

import React, { PureComponent, PropTypes } from "react"
import ReactDOM from "react-dom"
import CSSTransitionGroup from "react-transition-group/CSSTransitionGroup"
import classnames from "classnames"

const FILE_MODES = ["open","save","saveas"]

function Loading(props) {
  const isLoading = props.isLoading;
  if (isLoading) {
    return <h3>Loading</h3>;
  }
  return null;
}

function Saving(props) {
  const isSaving = props.isSaving;
  if (isSaving) {
    return <h3>Saving</h3>;
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
    onDirectoryRename: React.PropTypes.func,
    onDirectoryDelete: React.PropTypes.func,
    onFileRename: React.PropTypes.func,
    onFileDelete: React.PropTypes.func,
    onFileLoaded: React.PropTypes.func,
    mode: PropTypes.oneOf(FILE_MODES),
  };

  static defaultProps = {
    className: null,
    size: null,
    root: null,
    contents: '',
    onSave: function(filepath){},
    onDirectoryRename: function(oldName,newName,newPath){},
    onDirectoryDelete: function(name,path){},
    onFileLoaded: function(contents,name,path){},
    onFileRename: function(oldName,newName,newPath){},
    onFileDelete: function(name,path){},
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
      isSaving: false,
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
      saveAsComments: '',
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
   handleError
  */
  handleError(error, message, callback) {
    console.log('Request failed', error);

    if (error && error.code && error.code == 403) {
      window.location.href = '/';
    } else if (message) {
      alert(message);
      callback.call(this);
    }
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

  /*
   loadFile
  */
  loadFile(name) {
    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    this.setState( {
      isLoading: true,
      isSaving: false,
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
      .then(this.textResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.props.onFileLoaded(data, name, newPath);
        this.setState( { isLoading: false, directories: [], files: [], breadcrumb: [] });
      })
      .catch(error => {
        this.handleError(error, 'Error loading file', () => {
          this.setState( { isLoading: false, directories: [], files: [], breadcrumb: [] });
          this.loadDirectory();
        });
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

    fetch(this.props.source + newPath, {
        method: 'get',
        credentials: 'include'
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(posts => {
        let directories = [];
        let files = [];

        for (var i=0; i<posts.directories.length; i++) {
          directories.push( { name: posts.directories[i], editing: false, actionsOpen: false, editedDirectoryName: '', deleting: false } );
        }
        for (var i=0; i<posts.files.length; i++) {
          files.push( { name: posts.files[i].name, editing: false, actionsOpen: false, editedFileName: '', deleting: false } );
        }

        if (name) {
          breadcrumb.push(name);
        }

        this.setState( { isLoading: false, directories: directories, files: files, breadcrumb: breadcrumb });
      })
      .catch(error => {
        this.handleError(error, 'Error loading directories', () => {
          this.setState( { isLoading: false, directories: directories, files: files, newDirectoryFormVisible: false, newDirectoryName: '' });
          this.props.onCancel();
        })
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
   onFileSaved
  */
  onFileSaved(overwrite) {
    const { saveAsFileName, saveAsComments, breadcrumb, rootPath } = this.state;

    if (saveAsFileName.length <= 0) {
      alert('Filename is required');
      return;
    }

    this.setState({ isSaving: true })

    const newFilePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + saveAsFileName;

    var headers ={
      "Content-type": "text/plain; charset=UTF-8"
    }
    if (overwrite) {
      headers['x-action'] = 'overwrite';
    }
    if (saveAsComments) {
      headers['x-comments'] = saveAsComments;
    }

    let fileContent = this.props.contents; //JSON.stringify(this.props.contents)

    fetch('http://127.0.0.1:3000/svn/' + newFilePath, {
        method: 'post',
        credentials: 'include',
        headers: headers,
        body: fileContent
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.setState({ isSaving: false })
        this.props.onSave(fileContent, saveAsFileName, newFilePath);
      })
      .catch(error => {
        if (error && error.reasonCode && error.reasonCode == 409 && confirm('The file already exists. Do you want to overwrite the file?')) {
          this.onFileSaved(true);
        } else {
          this.handleError(error, 'Error saving file', () => {
            this.setState({ isSaving: false })
          })
        }
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

    this.setState({ creatingNewDirectory: true })

    const newDirectoryPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + newDirectoryName + '/';

    fetch(this.props.source + newDirectoryPath, {
        method: 'post',
        credentials: 'include'
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(posts => {
        this.setState({ creatingNewDirectory: false, newDirectoryName: '', newDirectoryFormVisible: false })
        this.loadDirectory(newDirectoryName);
      })
      .catch(error => {
        this.handleError(error, 'Error creating new directory', () => {
          this.setState({ creatingNewDirectory: false, newDirectoryName: '', newDirectoryFormVisible: false })
        })
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
    this.updateFileState(file, {editedFileName: evt.target.value});
  }

  /*
   updateSaveAsFileNameValue
  */
  updateSaveAsFileNameValue(evt) {
    this.setState({
      saveAsFileName: evt.target.value
    });
  }

  /*
   updateSaveAsCommentsValue
  */
  updateSaveAsCommentsValue(evt) {
    this.setState({
      saveAsComments: evt.target.value
    });
  }

  /*
   closeAllActionMenus
  */
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

  /*
   deleteDirectory
  */
  deleteDirectory(directory, evt) {
    evt.stopPropagation();

    if (!confirm('Are you sure you want to delete this directory and all of its contents?')) {
      return;
    }

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    let directoryPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + directory.name + '/';

    this.updateDirectoryState(directory, {deleting:true});

    fetch(this.props.source + directoryPath, {
        method: 'delete',
        credentials: 'include',
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.props.onDirectoryDelete(directory.name, directoryPath);
      })
      .catch(error => {
        this.handleError(error, 'Error deleting directory', () => {
          this.updateDirectoryState(directory, {deleting:false});
        })
      });

  }

  /*
   editDirectory
  */
  editDirectory(directory, evt) {
    evt.stopPropagation();
    this.closeAllActionMenus();
    this.updateDirectoryState(directory, {editedDirectoryName: directory.name, editing: true, actionsOpen: false});
  }

  /*
   cancelEditDirectory
  */
  cancelEditDirectory(directory, evt) {
    evt.stopPropagation();
    this.updateDirectoryState(directory, {editedDirectoryName:'', editing: false, actionsOpen: false});
  }

  /*
   saveEditDirectory
  */
  saveEditDirectory(directory, evt) {
    evt.stopPropagation();

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    let directoryPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + directory.name + '/';
    let newDirectoryPath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + directory.editedDirectoryName + '/';
    let oldName = directory.name;
    let newName = directory.editedDirectoryName;

    this.updateDirectoryState(directory, {name: directory.editedDirectoryName, editedDirectoryName:'', editing:false, actionsOpen: false});

    fetch(this.props.source + directoryPath, {
        method: 'put',
        credentials: 'include',
        headers: {
          "Content-type": "text/plain; charset=UTF-8"
        },
        body: directory.name
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.props.onDirectoryRename(oldName, directoryPath, newName, newDirectoryPath);
      })
      .catch(error => {
        this.handleError(error, 'Error renaming directory "'+directory.name+'"', () => {
          this.updateDirectoryState(directory, {name:oldName});
        })
      });
  }

  /*
   updateDirectoryState
  */
  updateDirectoryState(directory, newState) {
    let { directories } = this.state;
    for (var idx in directories) {
      if (directories[idx] == directory) {
        for (var i in newState) {
          directories[idx][i] = newState[i];
        }
        this.setState({directories: directories});
        return;
      }
    }
  }

  /*
   editFile
  */
  editFile(file, evt) {
    evt.stopPropagation();
    this.updateFileState(file, {editedFileName: file.name, editing: true, actionsOpen: false});
  }

  /*
   cancelEditFile
  */
  cancelEditFile(file, evt) {
    evt.stopPropagation();
    this.updateFileState(file, {editedFileName: '', editing: false, actionsOpen: false});
  }

  /*
   saveEditFile
  */
  saveEditFile(file, evt) {
    evt.stopPropagation();

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    let filePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + file.name;
    let newFilePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + file.editedFileName;
    let oldName = file.name;
    let newName = file.editedFileName;

    this.updateFileState(file, { name: file.editedFileName, editedFileName: '', editing: false, actionsOpen: false });

    fetch(this.props.source + filePath, {
        method: 'put',
        credentials: 'include',
        headers: {
          "Content-type": "text/plain; charset=UTF-8",
          "x-action": "rename"
        },
        body: file.name
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.props.onFileRename(oldName, filePath, newName, newFilePath);
      })
      .catch(error => {
        this.handleError(error, 'Error renaming file "'+file.name+'"', () => {
          this.updateFileState(file, {name:oldName});
        })
      });
  }

  /*
   updateFileState
  */
  updateFileState(file, newState) {
    let { files } = this.state;
    for (var idx in files) {
      if (files[idx] == file) {
        for (var i in newState) {
          files[idx][i] = newState[i];
        }
        this.setState({files: files});
        return;
      }
    }
  }

  /*
   textResponse
  */
  textResponse(response) {
    if (!response.ok) {
      throw {code:response.status,reason:response.statusText}
    }
    return response.text()
  }

  /*
   jsonResponse
  */
  jsonResponse(response) {
    if (!response.ok) {
      throw {code:response.status,reason:response.statusText}
    }

    return response.json();
  }

  /*
   apiResponse
  */
  apiResponse(data) {
    if (data && data.success && data.success == true) {
      return data;
    }
    throw {code:500,reasonCode:((data && data.errorCode) ? data.errorCode : 0),reason:((data && data.errorMsg) ? data.errorMsg : 'Server error')}
  }

  /*
   deleteFile
  */
  deleteFile(file, evt) {
    evt.stopPropagation();

    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    let filePath = rootPath + (breadcrumb.length > 0 ? (breadcrumb.join('/') + '/') : '') + file.name;

    this.updateFileState(file, {deleting:true});

    fetch(this.props.source + filePath, {
        method: 'delete',
        credentials: 'include',
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.props.onFileDelete(file.name, filePath);
      })
      .catch(error => {
        this.handleError(error, 'Error deleting file', () => {
          this.updateFileState(file, {deleting:false});
        })
      });
  }

  /*
   toggleCurrentDirectoryActionMenu
  */
  toggleCurrentDirectoryActionMenu(evt) {
    this.closeAllActionMenus();
    this.setState({currentDirectoryActionMenuOpen: !this.state.currentDirectoryActionMenuOpen, currentDirectoryActionsWidth: ReactDOM.findDOMNode(evt.currentTarget.parentElement).querySelector('.actions').offsetWidth });
  }

  /*
   editCurrentDirectoryNameValue
  */
  editCurrentDirectoryNameValue(evt) {
    this.setState({
      editedCurrentDirectoryName: evt.target.value
    });
  }

  /*
   editCurrentDirectory
  */
  editCurrentDirectory(evt) {
    const {breadcrumb} = this.state;
    evt.stopPropagation();
    this.setState({editedCurrentDirectoryName: breadcrumb[breadcrumb.length - 1], editingCurrentDirectory: true, currentDirectoryActionMenuOpen: false});
  }

  /*
   cancelEditCurrentDirectory
  */
  cancelEditCurrentDirectory(evt) {
    evt.stopPropagation();
    this.setState({editedCurrentDirectoryName: '', editingCurrentDirectory: false, currentDirectoryActionMenuOpen: false});
  }

  /*
   saveEditCurrentDirectory
  */
  saveEditCurrentDirectory(evt) {
    evt.stopPropagation();

    const { rootPath, rootCurrentDirectory, editedCurrentDirectoryName, files, directories } = this.state
    let { breadcrumb } = this.state;

    if (breadcrumb.length <= 0) {
      alert('Can not rename the root directory');
      return;
    }

    this.setState({isLoading: true, editedCurrentDirectoryName: '', editingCurrentDirectory: false, currentDirectoryActionMenuOpen: false});

    let directoryPath = rootPath + breadcrumb.join('/') + '/';
    let oldName = breadcrumb.pop()
    let newName = editedCurrentDirectoryName;
    let newDirectoryPath = rootPath + breadcrumb.join('/') + editedCurrentDirectoryName + '/';

    fetch(this.props.source + directoryPath, {
        method: 'put',
        credentials: 'include',
        headers: {
          "Content-type": "text/plain; charset=UTF-8"
        },
        body: newName
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        breadcrumb.push(newName);
        this.setState({isLoading: false, breadcrumb: breadcrumb});
        this.props.onDirectoryRename(oldName, directoryPath, newName, newDirectoryPath);
      })
      .catch(error => {
        this.handleError(error, 'Error renaming directory "'+oldName+'"', () => {
          breadcrumb.push(oldName);
          this.setState({isLoading: false, breadcrumb: breadcrumb});
        })
      });
  }

  /*
   deleteCurrentDirectory
  */
  deleteCurrentDirectory(evt) {
    evt.stopPropagation();

    const { rootPath, rootCurrentDirectory, files, directories } = this.state
    let { breadcrumb } = this.state;

    if (breadcrumb.length <= 0) {
      alert('Can not delete the root directory');
      return;
    }

    if (!confirm('Are you sure you want to delete this directory and all of its contents?')) {
      return;
    }

    let directoryPath = rootPath + breadcrumb.join('/') + '/';
    this.setState({isLoading: true, currentDirectoryActionMenuOpen: false});

    fetch(this.props.source + directoryPath, {
        method: 'delete',
        credentials: 'include',
      })
      .then(this.jsonResponse)
      .then(this.apiResponse)
      .then(data => {
        //console.log('Request succeeded with JSON response', data);
        this.setState({isLoading: false});
        this.loadParentDirectory();
        this.props.onDirectoryDelete(breadcrumb[breadcrumb.length - 1], directoryPath);
      })
      .catch(error => {
        this.handleError(error, 'Error deleting directory', () => {
          this.setState({isLoading: false});
        })
      });
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
          <div className="current-directory" style={{overflow:"hidden",position:"relative",display:((this.state.isLoading || this.state.isSaving) ? 'none' : 'block')}}>
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
            <Saving isSaving={this.state.isSaving}></Saving>
            <ul key="items" className={listClassName} style={{margin:"0",padding:"0",listStyle:"none",display:((this.state.isSaving || this.state.isLoading) ? "none":"block")}}>
              { (this.state.breadcrumb.length > 0 && this.state.isLoading == false && this.state.isSaving == false) ? <li className="parent-directory" style={{height:'40px',borderBottomWidth:'1px'}}><span className="label" onClick={this.loadParentDirectory.bind(this)}>Up one directory</span></li> : null }
              {this.state.directories.map(child => (
                <li key={child.name} className="directory" style={{height:(child.deleting ? '0px' : '40px'),borderBottomWidth:(child.deleting ? '0px' : '1px')}}>
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
                <li key={child.name} className="file" style={{height:(child.deleting ? '0px' : '40px'),borderBottomWidth:(child.deleting ? '0px' : '1px')}}>
                  <span className="actions">
                    <button className="btn edit-btn" onClick={evt => { this.editFile(child,evt) } }></button>
                    <button className="btn delete-btn" onClick={evt => { this.deleteFile(child, evt) } }></button>
                  </span>
                  <span className="label" style={{left: child.actionsOpen ? ((child.actionsWidth+45)+'px') : '30px'}} onClick={e => { if (child.editing == false && this.props.mode == 'open') { this.loadFile(child.name) } }}>{
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
          {this.props.mode != 'open' ? <input disabled={creatingNewDirectory || this.state.isLoading || this.state.isSaving} type="text" placeholder="Filename" ref="filenameInput" value={this.state.saveAsFileName} onChange={this.updateSaveAsFileNameValue.bind(this)} style={{display: "block", fontSize: "1.3em", padding: "8px 12px", width: "100%", border: "solid 1px #797979", borderRadius: "0", margin: "20px 0 10px 0" }}/> : null}
          {this.props.mode != 'open' ? <textarea disabled={creatingNewDirectory || this.state.isLoading || this.state.isSaving} placeholder="Comments" ref="commentsInput" onChange={this.updateSaveAsCommentsValue.bind(this)} rows="3" style={{display: "block", fontWeight: "normal", minHeight: "auto", fontSize: "1.3em", padding: "8px 12px", width: "100%", border: "solid 1px #797979", borderRadius: "0", margin: "20px 0 10px 0" }}>{this.state.saveAsCommnets}</textarea> : null}
        </div>
        <div className="right" style={{paddingTop: "15px", marginTop: "10px",borderTop: "solid 1px #d4d4d4"}}>
          <button disabled={creatingNewDirectory || this.state.isLoading || this.state.isSaving} className="btn cancel" onClick={this.props.onCancel}>Cancel</button>
          { this.props.mode == 'save' ? (<button disabled={creatingNewDirectory || this.state.isLoading || this.state.isSaving} className="btn" onClick={evt => { this.onFileSaved(false) }}>Save</button>) : null }
          { this.props.mode == 'saveas' ? (<button disabled={creatingNewDirectory || this.state.isLoading || this.state.isSaving} className="btn" onClick={evt => { this.onFileSaved(false) }}>Save</button>) : null }
        </div>
      </div>
    )
  }
}
