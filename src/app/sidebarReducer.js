
import MenuReader from './MenuReader.js'
import Metadata from './Metadata.js'

import {
  getCookie,
  getApiKey,
  updateActiveProducts,
  activateProductInSelectedWindow,
  deactivateProductInSelectedWindow,
  genericCRUD
} from './coreFunctions.js'

// Initialize state: store.getState().sidebarReducer
const initialState = {
  open: false,
  workspaces: [],
  selectedWorkspace: false,
  menu: { menu: [] }
}

// Handle dispatched actions
const sidebarReducer = (state = initialState, action) => {

  let newState = Object.assign({}, state)
  let payLoad = {}

  switch(action.type){

    /* UI actions and WMS talk */

    case 'MENU_UPDATED':
      newState.menu = MenuReader.getMenuJson()
      return newState

    case 'TOGGLE_SIDEBAR':
      newState.open = !newState.open
      return newState

    case 'NEW_WORKSPACE':
      newState.workspaces[action.index] = action.workspace
      return newState

    case 'CHANGE_SIDEBAR_TARGET':
      newState.selectedWorkspace = action.index
      return newState

    case 'CHANGE_WINDOW_SELECTION':
      newState.menu = updateActiveProducts(newState.menu, newState.workspaces[newState.selectedWorkspace])
      return newState

    case 'TOGGLE_PRODUCTLIST':
      newState.menu.menu[action.menuIndex].open = !newState.menu.menu[action.menuIndex].open
      return newState

    case 'PRODUCT_ON':
      newState.menu.menu[action.menuIndex].items[action.itemIndex].active = true
      activateProductInSelectedWindow(newState.menu.menu[action.menuIndex].items[action.itemIndex], newState.workspaces[newState.selectedWorkspace])
      return newState

    case 'PRODUCT_OFF':
      newState.menu.menu[action.menuIndex].items[action.itemIndex].active = false
      deactivateProductInSelectedWindow(newState.menu.menu[action.menuIndex].items[action.itemIndex], newState.workspaces[newState.selectedWorkspace])
      return newState

    default:
      return newState

  }

}

export default sidebarReducer
