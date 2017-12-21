import PetstoreYaml from "./petstore"
const CONTENT_KEY = "swagger-editor-content"
const LASTSAVEDCONTENT_KEY = "swagger-editor-lastsavedcontent"
const FILENAME_KEY = "swagger-editor-filename"
const FILEPATH_KEY = "swagger-editor-filepath"

let localStorage = window.localStorage
let lastSavedStr = ''
let hasUnsavedChanges = false
//let currStr = ''

export const updateSpec = (ori) => (...args) => {
  let [spec] = args
  ori(...args)
  hasUnsavedChanges = spec != lastSavedStr
  saveContentToStorage(spec)
}

export const onFileLoaded = (contents, filename, filepath) => (...args) => {
  hasUnsavedChanges = false
  saveFilePathAndContentsToStorage(filename, filepath, contents)
}

export const onFileRenamed = (filename, filepath) => (...args) => {
  saveFilePathToStorage(filename, filepath)
}

export const setFilePath = (filepath) => (...args) => {
  localStorage.setItem(FILEPATH_KEY, filepath)
  localStorage.setItem(FILENAME_KEY, filepath.replace(/^.*\/(.*?)$/g, '$1'));
}

export const clearFilePath = () => (...args) => {
  saveFilePathAndContentsToStorage("", "", "")
}

export function getFileName() {
  let fileName = localStorage.getItem(FILENAME_KEY);
  return fileName && fileName.length > 0 ? fileName : null
}

export function doesHaveUnsavedChanges() {
  return hasUnsavedChanges
}

export function getFilePath() {
  return localStorage.getItem(FILEPATH_KEY)
}

export default function(system) {
  // setTimeout runs on the next tick
  setTimeout(() => {
    if(localStorage.getItem(CONTENT_KEY)) {
      let content = localStorage.getItem(CONTENT_KEY)
      lastSavedStr = localStorage.getItem(LASTSAVEDCONTENT_KEY)
      system.specActions.updateSpec(content)
      onFileLoaded(lastSavedStr, localStorage.getItem(FILENAME_KEY), localStorage.getItem(FILEPATH_KEY))
      hasUnsavedChanges = content != lastSavedStr
    } else {
      system.specActions.updateSpec("")
      saveContentToStorage("")
      clearFilePath()
    }
  }, 0)
  return {
    statePlugins: {
      spec: {
        wrapActions: {
          updateSpec
        },
        actions: {
          onFileLoaded,
          onFileRenamed,
          clearFilePath,
          setFilePath
        },
        selectors: {
          getFileName,
          getFilePath,
          doesHaveUnsavedChanges,
        }
      }
    }
  }
}

function saveContentToStorage(str) {
  if (str === undefined || str === null) {
    str = ""
  }

  return localStorage.setItem(CONTENT_KEY, str)
}

function saveFilePathToStorage(filename, filepath) {
  if (filename === undefined || filename === null) {
    filename = ""
  }

  if (filepath === undefined || filepath === null) {
    filepath = ""
  }

  var contents = localStorage.getItem(CONTENT_KEY)
  lastSavedStr = contents
  localStorage.setItem(FILENAME_KEY, filename)
  localStorage.setItem(FILEPATH_KEY, filepath)
  localStorage.setItem(LASTSAVEDCONTENT_KEY, lastSavedStr)
  saveContentToStorage(contents);
  return  true
}

function saveFilePathAndContentsToStorage(filename, filepath, contents) {
  if (filename === undefined || filename === null) {
    filename = ""
  }

  if (filepath === undefined || filepath === null) {
    filepath = ""
  }

  lastSavedStr = contents
  localStorage.setItem(FILENAME_KEY, filename)
  localStorage.setItem(FILEPATH_KEY, filepath)
  localStorage.setItem(LASTSAVEDCONTENT_KEY, contents)
  saveContentToStorage(lastSavedStr);
  return  true
}
