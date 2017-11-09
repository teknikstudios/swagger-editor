import React, { PropTypes } from "react"
import Swagger from "swagger-client"
import "whatwg-fetch"
import DropdownMenu from "./DropdownMenu"
import FileChooser from "./FileChooser"
import SaveFileAs from "./SaveFileAs"
import Axios from 'axios';
import Modal from "boron/DropModal"
import downloadFile from "react-file-download"
import YAML from "js-yaml"
import beautifyJson from "json-beautify"

import "react-dd-menu/dist/react-dd-menu.css"
import "./topbar.less"
import Logo from "./logo_small.png"

export default class Topbar extends React.Component {
  constructor(props, context) {
    super(props, context)

    Swagger("https://generator.swagger.io/api/swagger.json", {
      requestInterceptor: (req) => {
        req.headers["Accept"] = "application/json"
        req.headers["content-type"] = "application/json"
      }
    })
      .then(client => {
        this.setState({ swaggerClient: client })
        client.apis.clients.clientOptions()
          .then(res => {
            this.setState({ clients: res.body })
          })
        client.apis.servers.serverOptions()
          .then(res => {
            this.setState({ servers: res.body })
          })
      })

    this.state = {
      swaggerClient: null,
      clients: [],
      servers: []
    }
  }

  // Menu actions

  /*
   importFromURL
  */
  importFromURL = () => {
    let url = prompt("Enter the URL to import from:")

    if(url) {
      fetch(url)
        .then(res => res.text())
        .then(text => {
          this.props.specActions.updateSpec(
            YAML.safeDump(YAML.safeLoad(text))
          )
          this.props.specActions.clearFilePath()
        })
    }
  }

  /*
   importFromFile
  */
  importFromFile = () => {
    let fileToLoad = this.refs.fileLoadInput.files.item(0)
    let fileReader = new FileReader()

    fileReader.onload = fileLoadedEvent => {
      let textFromFileLoaded = fileLoadedEvent.target.result
      this.props.specActions.updateSpec(YAML.safeDump(YAML.safeLoad(textFromFileLoaded)))
      this.props.specActions.clearFilePath()
      this.hideModal()
    }

    fileReader.readAsText(fileToLoad, "UTF-8")
  }

  /*
   saveAsYaml
  */
  saveAsYaml = () => {
    // Editor content -> JS object -> YAML string
    let editorContent = this.props.specSelectors.specStr()
    let jsContent = YAML.safeLoad(editorContent)
    let yamlContent = YAML.safeDump(jsContent)
    downloadFile(yamlContent, "swagger.yaml")
  }

  /*
   saveAsJson
  */
  saveAsJson = () => {
    // Editor content  -> JS object -> Pretty JSON string
    let editorContent = this.props.specSelectors.specStr()
    let jsContent = YAML.safeLoad(editorContent)
    let prettyJsonContent = beautifyJson(jsContent, null, 2)
    downloadFile(prettyJsonContent, "swagger.json")
  }

  /*
   saveAsText
  */
  saveAsText = () => {
    // Download raw text content
    let editorContent = this.props.specSelectors.specStr()
    downloadFile(editorContent, "swagger.txt")
  }

  /*
   saveFile
  */
  saveFile = () => {
    let editorContent = this.props.specSelectors.specStr()
    let filePath = this.props.specSelectors.getFilePath();
    let fileName = this.props.specSelectors.getFileName();

    if (fileName === null || fileName.length <= 0) {
      this.refs.saveFileModal.show()
    } else {
      this.refs.savingModal.show()
      Axios.put('http://localhost:3000/svn/' + filePath, editorContent, { headers: { 'Content-Type': 'text/plain' } })
        .then(res => {
          this.onFileLoaded(editorContent, fileName, filePath)
          this.refs.savingModal.hide()
        });
    }
  }

  /*
   hideSaveFileModal
  */
  hideSaveFileModal = () => {
    this.refs.saveFileModal.hide()
  }

  /*
   convertToYaml
  */
  convertToYaml = () => {
    // Editor content -> JS object -> YAML string
    let editorContent = this.props.specSelectors.specStr()
    let jsContent = YAML.safeLoad(editorContent)
    let yamlContent = YAML.safeDump(jsContent)
    this.props.specActions.updateSpec(yamlContent)
  }

  /*
   downloadGeneratedFile
  */
  downloadGeneratedFile = (type, name) => {
    let { specSelectors } = this.props
    let swaggerClient = this.state.swaggerClient
    if(!swaggerClient) {
      // Swagger client isn't ready yet.
      return
    }
    if(type === "server") {
      swaggerClient.apis.servers.generateServerForLanguage({
        framework : name,
        body: JSON.stringify({
          spec: specSelectors.specJson()
        }),
        headers: JSON.stringify({
          Accept: "application/json"
        })
      })
        .then(res => handleResponse(res))
    }

    if(type === "client") {
      swaggerClient.apis.clients.generateClient({
        language : name,
        body: JSON.stringify({
          spec: specSelectors.specJson()
        })
      })
        .then(res => handleResponse(res))
    }

    function handleResponse(res) {
      if(!res.ok) {
        return console.error(res)
      }

      fetch(res.body.link)
        .then(res => res.blob())
        .then(res => {
          downloadFile(res, `${name}-${type}-generated.zip`)
        })
    }

  }

  /*
   clearEditor
  */
  clearEditor = () => {
    if(window.localStorage) {
      window.localStorage.removeItem("swagger-editor-content")
      this.props.specActions.clearFilePath()
      this.props.specActions.updateSpec("")
    }
  }

  // Helpers

  /*
   showModal
  */
  showModal = () => {
    this.refs.modal.show()
  }

  /*
   hideModal
  */
  hideModal = () => {
    this.refs.modal.hide()
  }

  /*
   saveFileAs
  */
  saveFileAs = () => {
    this.refs.saveFileAsModal.show()
  }

  /*
   hideSaveFileAsModal
  */
  hideSaveFileAsModal = () => {
    this.refs.saveFileAsModal.hide()
  }

  /*
   showOpenFileModal
  */
  showOpenFileModal = () => {
    this.refs.openFileModal.show()
  }

  /*
   hideOpenFileModal
  */
  hideOpenFileModal = () => {
    this.refs.openFileModal.hide()
  }

  /*
   onFileLoaded
  */
  onFileLoaded = (contents, filename, filepath) => {
    this.hideOpenFileModal()
    this.hideSaveFileAsModal()
    this.hideSaveFileModal()

    if (!contents || contents.length <= 0) {
      contents = "";
    } else {
      contents = YAML.safeDump(YAML.safeLoad(contents))
    }
    this.props.specActions.onFileLoaded(contents, filename, filepath)
    this.props.specActions.updateSpec(contents)
  }

  /*
   onFileSaveAs
  */
  onFileSaveAs = (contents, filename, filepath) => {
    this.onFileLoaded(contents, filename, filepath)
  }


  /*
   render
  */
  render() {
    let { getComponent, specSelectors: { isOAS3 } } = this.props
    const Link = getComponent("Link")

    let showGenerateMenu = !(isOAS3 && isOAS3())

    let makeMenuOptions = (name) => {
      let stateKey = `is${name}MenuOpen`
      let toggleFn = () => this.setState({ [stateKey]: !this.state[stateKey] })
      return {
        isOpen: !!this.state[stateKey],
        close: () => this.setState({ [stateKey]: false }),
        align: "left",
        toggle: <span className="menu-item" onClick={toggleFn}>{ name }</span>
      }
    }

    return (
      <div>
        <div className="topbar">
          <div className="topbar-wrapper">
            <Link href="#">
              <img height="30" width="30" className="topbar-logo__img" src={ Logo } alt=""/>
              <span className="topbar-logo__title">Swagger Editor</span>
            </Link>
            <DropdownMenu {...makeMenuOptions("File")}>
              <li><button type="button" onClick={this.clearEditor}>New</button></li>
              <li><button type="button" onClick={this.showOpenFileModal}>Open...</button></li>
              <li role="separator"></li>
              <li><button type="button" onClick={this.saveFile.bind(this)}>Save</button></li>
              <li><button type="button" onClick={this.saveFileAs.bind(this)}>Save As...</button></li>
              <li role="separator"></li>
              <li><button type="button" onClick={this.importFromURL}>Import URL</button></li>
              <li><button type="button" onClick={this.showModal}>Import File</button></li>
              <li role="separator"></li>
              <li><button type="button" onClick={this.saveAsYaml}>Download YAML</button></li>
              <li><button type="button" onClick={this.saveAsJson}>Download JSON</button></li>
            </DropdownMenu>
            <DropdownMenu {...makeMenuOptions("Edit")}>
              <li><button type="button" onClick={this.convertToYaml}>Convert to YAML</button></li>
            </DropdownMenu>
            { showGenerateMenu ? <DropdownMenu className="long" {...makeMenuOptions("Generate Server")}>
              { this.state.servers
                  .map(serv => <li key={serv}><button type="button" onClick={this.downloadGeneratedFile.bind(null, "server", serv)}>{serv}</button></li>) }
            </DropdownMenu> : null }
            { showGenerateMenu ? <DropdownMenu className="long" {...makeMenuOptions("Generate Client")}>
              { this.state.clients
                  .map(cli => <li key={cli}><button type="button" onClick={this.downloadGeneratedFile.bind(null, "client", cli)}>{cli}</button></li>) }
            </DropdownMenu> : null }
          </div>
        </div>
        <Modal className="swagger-ui modal" ref="modal">
          <div className="container">
            <h2>Upload file</h2>
            <input type="file" ref="fileLoadInput"></input>
          </div>
          <div className="right">
            <button className="btn cancel" onClick={this.hideModal}>Cancel</button>
            <button className="btn" onClick={this.importFromFile}>Open file</button>
          </div>
        </Modal>
        <Modal className="swagger-ui modal saving-modal" closeOnClick={false} ref="savingModal">
          <h3>Saving</h3>
        </Modal>
        <Modal className="swagger-ui modal" closeOnClick={false} ref="openFileModal">
          <SaveFileAs mode="open" source="http://localhost:3000/svn/" onFileLoaded={this.onFileLoaded.bind(this)} root="/specs/" onCancel={this.hideOpenFileModal.bind(this)}>
          </SaveFileAs>
        </Modal>
        <Modal className="swagger-ui modal" closeOnClick={false} ref="saveFileModal">
          <SaveFileAs mode="save" source="http://localhost:3000/svn/" contents={this.props.specSelectors.specStr()} root="/specs/" onSave={this.onFileSaveAs.bind(this)} onCancel={this.hideSaveFileModal.bind(this)}>
          </SaveFileAs>
        </Modal>
        <Modal className="swagger-ui modal" closeOnClick={false} ref="saveFileAsModal">
          <SaveFileAs mode="saveas" source="http://localhost:3000/svn/" contents={this.props.specSelectors.specStr()} root="/specs/" onSave={this.onFileSaveAs.bind(this)} onCancel={this.hideSaveFileAsModal.bind(this)}>
          </SaveFileAs>
        </Modal>
      </div>

    )
  }
}

Topbar.propTypes = {
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired
}
