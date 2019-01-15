/**
 * Application entry point
 */

// Load application styles
import '../styles/home.less'
import '../styles/base.less'
import '../styles/map.less'
import '../styles/timeSlider.less'
import '../styles/timeSliderRotated.less'

// React & component imports
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider, connect } from 'react-redux'
import '../styles/layout.css'
import UserInfo from './UserInfo.jsx'
import Sidebar from './Sidebar.jsx'
import DotsMenu from './DotsMenu.jsx'
import EditableTitle from './EditableTitle.jsx'
import MenuReader from '../app/MenuReader.js'
import { getApiKey } from '../app/coreFunctions.js'
import mainStore from '../app/mainStore.js'
import { authorize, loadSession, saveSession } from '../app/asyncActions.js'
import { version } from '../../package.json'
import Layout from './Layout.jsx'
import ReactResizeDetector from 'react-resize-detector'

let firstShownIndex = 0
let currentWorkspace = 0
let active_workspaces = []

class MainView extends React.Component{

  constructor(props) {
    super(props);
    this.workspaceLayouts = []
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  componentDidMount() {
    this.createWorkspace()
    this.props.initializeMenu()
    this.props.loadUserFromBasicAuth(mainStore.metStore.getState().mainReducer.user)
    document.addEventListener('keypress', this.handleKeyPress);
  }

  handleKeyPress(event) {
    if ((event.which == 115 || event.which == 19) && event.ctrlKey){
      event.preventDefault();
      alert("Saving session");
      this.props.saveSession(mainStore.metStore.getState().sidebarReducer.workspaces, mainStore.metStore.getState().mainReducer.user);
    }
    if (event.which == 108 && event.ctrlKey){
      event.preventDefault();
      alert("Loading previous session");
      this.props.loadSession(mainStore.metStore.getState().mainReducer.user);
    }
    return false;
  }


  componentWillUnmount() {
     document.removeEventListener('keypress', this.handleKeyPress);
  }

  /* Temporary jQuery hack */
  componentDidUpdate() {
    var currentState = mainStore.metStore.getState().sidebarReducer;
    var selectedWorkspaceIndex = currentState.selectedWorkspace;
    currentState.workspaces.forEach((workspace, workspaceIndex) => {
      var workspaceElement = $('#fmi-metweb-windows' + (workspaceIndex + 1))
      if(workspaceIndex == currentState.selectedWorkspace){
        workspaceElement.show();
      } else{
        workspaceElement.hide()
      }
    })
  }

  createWorkspace () {

    var workspaceIndex = mainStore.metStore.getState().sidebarReducer.workspaces.length
    var workspaceId = (workspaceIndex + 1).toString()
    var containerId = 'fmi-metweb-windows' + workspaceId

/*
    var newWorkspaceContainer = document.createElement('div')
    newWorkspaceContainer.id = containerId
    newWorkspaceContainer.dataset.workspaceId = workspaceId
    newWorkspaceContainer.classList.add('workspace-container')
*/

//    var baseWorkspaceContainer = document.getElementById('fmi-metweb-windows')
//    baseWorkspaceContainer.appendChild(newWorkspaceContainer)

    document.getElementById("version").innerHTML = version;

/*
    let workspace = new Layout(containerId)
      .onSelectionChanged(function(id){
        // Dispatch action to update Sidebar
        // 0ms  timeout to wait for goldenLayout updates
        setTimeout(function(){ this.props.changeWindow() }.bind(this), 0)
      }.bind(this))

      // More available methods
      .onWindowCreated(function (id) { })
      .onBookmarkAdded(function (id) { })
      .onDestroyed(function (id) { })
      .create('Työpöytä ' + workspaceId)
*/

    var workspace = {
      settings: {
        hasHeaders: true,
        constrainDragToContainer: true,
        reorderEnabled: true,
        selectionEnabled: true,
        popoutWholeStack: false,
        blockedPopoutsThrowError: true,
        closePopoutsOnUnload: true,
        showPopoutIcon: false,
        showMaximiseIcon: false,
        showCloseIcon: false
      },
      dimensions: {
        borderWidth: 10,
        minItemHeight: 10,
        minItemWidth: 10,
        headerHeight: 40,
        dragProxyWidth: 300,
        dragProxyHeight: 200
      },
      labels: {
        close: 'close',
        maximise: 'maximise',
        minimise: 'minimise',
        popout: 'open in new window'
      },
      content: [{
        type: 'column',
        isClosable: false,
        content: [{
          type: 'row',
          isClosable: false,
          content: [{
            type: 'component',
            componentName: 'metoclient',
            title: 'Window 1',
            isClosable: false,
            index: 0,
            props: {}
          }]
        }]
      }]
    }
    this.props.addWorkspace(workspace, workspaceIndex)
    firstShownIndex = active_workspaces.length - 4
  }

  selectWorkspace (workspaceIndex) {
    this.props.selectWorkSpace(workspaceIndex)
    currentWorkspace = workspaceIndex
    // 100ms timeout to wait for goldenLayout updates
    setTimeout(function(){ this.props.changeWindow() }.bind(this), 100)
  }

  moveWorkspaceIcons (direction) {
    //console.log(store.getState().sidebarReducer.workspaces)
    var changed = false
    var broken = false
    if (direction == "next") {
      var index = 0
      for (let workspaceIndex of active_workspaces) {
        if (changed) {
          this.selectWorkspace(workspaceIndex)
          broken = true
          break;
        }
        if (index > firstShownIndex) {
          firstShownIndex = Math.min(index, active_workspaces.length - 5)
        }
        if (workspaceIndex == currentWorkspace) {
          changed = true
        }
        index++
      }
      if(!broken) {
        this.selectWorkspace(active_workspaces[active_workspaces.length - 1])
        firstShownIndex = active_workspaces[active_workspaces.length - 5]
      }
    } else {
      var reversed_workspaces = active_workspaces.reverse()
      var index = reversed_workspaces.length - 1
      for (let workspaceIndex of reversed_workspaces) {
        if (changed) {
          this.selectWorkspace(workspaceIndex)
          broken = true
          break;
        }
        if (workspaceIndex == currentWorkspace) {
          changed = true
        }
        index--
        if (index < firstShownIndex) {
          firstShownIndex = Math.max(index, 0)
        }
      }
      if(!broken) {
        this.selectWorkspace(active_workspaces[active_workspaces.length - 1])
        firstShownIndex = active_workspaces[active_workspaces.length - 1]
      }
    }
    this.render()
  }

  toggleFullscreen() {
     var elem = document.body; // Make the body go full screen.
     var isInFullScreen = (document.fullScreenElement && document.fullScreenElement !== null) ||  (document.mozFullScreen || document.webkitIsFullScreen);

     if (isInFullScreen) {
       var requestMethod = document.cancelFullScreen||document.webkitCancelFullScreen||document.mozCancelFullScreen||document.exitFullscreen;
       if (requestMethod) { // cancel full screen.
         requestMethod.call(document);
       } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
         var wscript = new ActiveXObject("WScript.Shell");
         if (wscript !== null) {
           wscript.SendKeys("{F11}");
         }
       }
     } else {
       var requestMethod = elem.requestFullScreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
       if (requestMethod) { // Native full screen.
           requestMethod.call(elem);
       } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
           var wscript = new ActiveXObject("WScript.Shell");
           if (wscript !== null) {
               wscript.SendKeys("{F11}");
           }
       }
     }
     return false;
 }

  render(){
    var workspaceNav = []
    var currentState = mainStore.metStore.getState().sidebarReducer; // TODO ditch
    var index = 0;
    active_workspaces = []

    mainStore.metStore.getState().sidebarReducer.workspaces.forEach((workspace, workspaceIndex) => {
      if (workspace.golden !== null) {
        active_workspaces.push(workspaceIndex)
      }
    })
    if (firstShownIndex > active_workspaces[active_workspaces.length - 5]){
      firstShownIndex = active_workspaces[active_workspaces.length - 5]
    }
    active_workspaces.forEach((i) => {
      if (i >= firstShownIndex && workspaceNav.length < 5) {
        workspaceNav.push(
          <div key={"w"+i} className={"fmi-metweb-footer-workspace-icon "+(currentState.selectedWorkspace == i ? "selected" : "")} onClick={this.selectWorkspace.bind(this, i)}></div>
        )
      }
    })
    if (active_workspaces.length > 5) {
      workspaceNav.push(
        <div key="next" className="fmi-metweb-footer-workspace-arrow-next" onClick={this.moveWorkspaceIcons.bind(this, "next")}></div>
      )
      workspaceNav.unshift(
        <div key="prev" className="fmi-metweb-footer-workspace-arrow-prev" onClick={this.moveWorkspaceIcons.bind(this, "prev")}></div>
      )
    }

    const menuItems = [{
      title: 'Lisää uusi ali-ikkuna', // Todo: localization
      callback: () => {
        self.createWindow()
      }
    }, {
      title: 'Lisää näkymä suosikkeihin', // Todo: localization
      callback: () => {
      }
    }, {
      title: 'Sulje näkymä', // Todo: localization
      callback: () => {
        let background = document.getElementById(self.containerId)
        let confirmation = document.createElement("div")
        confirmation.classList = "confirmation_overlay"

        let wrapper = document.createElement("div")
        let confirmation_text = document.createElement("p")
        confirmation_text.classList = "confirmation_text"
        confirmation_text.innerHTML = "Haluatko varmasti poistaa näkymän?"

        let confirmation_button = document.createElement("div")
        confirmation_button.innerHTML = "Kyllä!"
        confirmation_button.classList = "fmi-metweb-filter-button"
        confirmation_button.addEventListener('click', () => {
          this.golden.destroy()
          let container = document.getElementById(this.containerId)
          let id = container.dataset.workspaceId
          while (container.firstChild) {
            container.removeChild(container.firstChild)
          }
          this.golden.layout.fmi.destroyed(id)
          this.golden = null

          confirmation.parentNode.removeChild(confirmation)
        })

        let back_button = document.createElement("div")
        back_button.innerHTML = "En!"
        back_button.classList = "fmi-metweb-filter-button"
        back_button.addEventListener('click', () => {
          confirmation.parentNode.removeChild(confirmation)
        })

        wrapper.appendChild(confirmation_text)
        wrapper.appendChild(confirmation_button)
        wrapper.appendChild(back_button)
        confirmation.appendChild(wrapper)
        background.prepend(confirmation)
      }
    }]

    return (

      <div id="fmi-metweb-react-app-container">

        <div id="fmi-metweb-header">

          <div id="fmi-metweb-header-title">
            MetWeb <span id="version"></span>  <a href="https://github.com/fmidev/metweb/releases"><img id="link" src="src/assets/images/link.png"></img></a>
          </div>
          <div id="fmi-metweb-header-other">

            <div id="fullscreen-button-container" onClick={this.toggleFullscreen.bind()}><img id="fullscreen" src="src/assets/images/fullscreen.png"></img>
            </div>
          </div>
          <UserInfo />

        </div>

        <div id="fmi-metweb-sidebar-windows-and-footer">

          <Sidebar open={false} />

        	<div id="fmi-metweb-windows-and-footer">

        		<div id="fmi-metweb-windows">
               <ReactResizeDetector handleWidth handleHeight onResize={this.onResize} />
              {this.props.workspaces.map((workspace, i) => {
               return (
                 <div id={`fmi-metweb-windows${i}`} className="workspace-container" data-workspace-id={i}>
                   <div data-reactroot>
                     <div>
                       <header>
                        <EditableTitle title={`Työpöytä ${i+1}`}
                                       onChange={val => this.create(val)}/>
                        <DotsMenu id={`menu-dots-${i}`}
                                  items={menuItems}
                        />
                       </header>
                       <Layout
                        config={workspace}
                        ref={layout => {
                          this['workspaceLayouts'][`${i}`] = layout
                        }}
                       />
                     </div>
                   </div>
                 </div>
               )
              })}
        		</div>

        		<div id="fmi-metweb-footer">
        			<div id="fmi-metweb-footer-empty">
        			</div>

        			<div id="fmi-metweb-footer-workspaces">
                {workspaceNav}
        			</div>

        			<div id="fmi-metweb-footer-new-workspace" onClick={this.createWorkspace.bind(this)}>
        			</div>

        		</div>

        	</div>

        </div>

      </div>

    )
  }

  onResize() {
    this.workspaceLayouts.forEach(workspaceLayout => {
      workspaceLayout.updateSize()
    })
  }

}


/* MainView functionality */

const mapStateToProps = (state) => {
  return {
    workspaces: state.sidebarReducer.workspaces,
    selectedWorkspace: state.sidebarReducer.selectedWorkspace,
    user: {
      name: state.mainReducer.user.name,
    },
    errors: state.mainReducer.errors,
    gotContentInSomeWindow: state.sidebarReducer.worthwhile // worthwhile to save, i.e. is data empty. could be just an explicit check in where used
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    saveSession: (workspaces, user) => {
      dispatch(saveSession(workspaces, user))
    },
    loadSession: (user) => {
      dispatch(loadSession(user))
    },
    initializeMenu: () => {
      MenuReader.setMenuJson(getApiKey(), function(){
        dispatch({type: "MENU_UPDATED"})
      })
    },
    loadUserFromBasicAuth: (user) => {
      dispatch({type: "LOG_IN"}) // synchronous
      dispatch(authorize(user)) // asynchronous
    },
    addWorkspace: (workspace, workspaceIndex) => {
      dispatch({type: "NEW_WORKSPACE", workspace: workspace, index: workspaceIndex})
    },
    selectWorkSpace: (workspaceIndex) => {
      dispatch({type: "CHANGE_SIDEBAR_TARGET", index: workspaceIndex})
    },
    changeWindow: () => {
      dispatch({type: "CHANGE_WINDOW_SELECTION"})
    }
  }
}

const MetWeb = connect(
  mapStateToProps,
  mapDispatchToProps
)(MainView)

ReactDOM.render(<Provider store={mainStore.metStore}><MetWeb /></Provider>, document.getElementById("fmi-metweb-entry"));
