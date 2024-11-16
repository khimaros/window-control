/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 *
 * Based on the initial version by ickyicky (https://github.com/ickyicky/window-calls),
 *
 */

import Gio from 'gi://Gio'
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'

const MR_DBUS_IFACE = `
<node>
   <interface name="org.gnome.Shell.Extensions.WindowCommander">
      <method name="List">
         <arg type="s" direction="out" name="windowList" />
      </method>
      <method name="GetDetails">
         <arg type="u" direction="in" name="winid" />
         <arg type="s" direction="out" name="windowDetails" />
      </method>
      <method name="GetFrameRect">
         <arg type="u" direction="in" name="winid" />
         <arg type="s" direction="out" name="frameRect" />
      </method>
      <method name="GetBufferRect">
         <arg type="u" direction="in" name="winid" />
         <arg type="s" direction="out" name="bufferRect" />
      </method>
      <method name="MoveToWorkspace">
         <arg type="u" direction="in" name="winid" />
         <arg type="s" direction="in" name="direction" />
      </method>
      <method name="Place">
         <arg type="u" direction="in" name="winid" />
         <arg type="i" direction="in" name="x" />
         <arg type="i" direction="in" name="y" />
         <arg type="u" direction="in" name="width" />
         <arg type="u" direction="in" name="height" />
      </method>
      <method name="Move">
         <arg type="u" direction="in" name="winid" />
         <arg type="i" direction="in" name="x" />
         <arg type="i" direction="in" name="y" />
      </method>
      <method name="Maximize">
         <arg type="u" direction="in" name="winid" />
      </method>
      <method name="Minimize">
         <arg type="u" direction="in" name="winid" />
      </method>
      <method name="Unmaximize">
         <arg type="u" direction="in" name="winid" />
      </method>
      <method name="Close">
         <arg type="u" direction="in" name="winid" />
      </method>
      <method name="GetFocusedMonitorDetails">
         <arg type="s" direction="out" name="focusedMonitorDetails" />
      </method>
   </interface>
</node>`

export default class WindowCommander extends Extension {
    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(MR_DBUS_IFACE, this)
        this._dbus.export(Gio.DBus.session, '/org/gnome/Shell/Extensions/WindowCommander')
    }

    disable() {
        this._dbus.flush()
        this._dbus.unexport()
        delete this._dbus
    }

    _getWindowById(winid) {
        const windows = global.get_window_actors()
        const metaWindow = windows.find((win) => win.meta_window.get_id() == winid)
        return metaWindow ?? null
    }

    _getMonitorWorkAreaByWindow(win) {
        const { x, y, width, height } = win.meta_window.get_work_area_current_monitor()
        return {
            x,
            y,
            width,
            height,
        }
    }

    GetDetails(winid) {
        const win = this._getWindowById(winid)
        if (!win) {
            throw new Error('Window not found')
        }

        const props = {
            get: ['id', 'monitor', 'wm_class', 'wm_class_instance', 'maximized'],
            has: ['focus'],
            booleans: new Map([
                ['canMove', 'allows_move'],
                ['canResize', 'allows_resize'],
                ['canClose', 'can_close'],
                ['canMaximize', 'can_maximize'],
                ['canMinimize', 'can_minimize'],
            ]),
            rectangles: new Map([
                ['windowArea', 'get_frame_rect'],
                ['currentMonitorWorkArea', 'get_work_area_current_monitor'],
                ['allMonitorsWorkArea', 'get_work_area_all_monitors'],
            ]),
        }

        const windowDetails = {}
        props.get.forEach((name) => (windowDetails[name] = win.meta_window[`get_${name}`]?.()))
        props.has.forEach((name) => (windowDetails[name] = win.meta_window[`has_${name}`]?.()))
        props.booleans.forEach((fname, name) => {
            windowDetails[name] = win.meta_window[fname]?.()
        })
        props.rectangles.forEach((fname, name) => {
            const monitorRectangle = win.meta_window[fname]?.()
            const rect = {
                x: monitorRectangle.x,
                y: monitorRectangle.y,
                width: monitorRectangle.width,
                height: monitorRectangle.height,
            }
            windowDetails[name] = rect
        })

        const workspaceManager = global.workspace_manager
        windowDetails.in_current_workspace = win.meta_window.located_on_workspace?.(
            workspaceManager.get_active_workspace?.()
        )

        return JSON.stringify(windowDetails)
    }

    List() {
        const windows = global.get_window_actors()
        const workspaceManager = global.workspace_manager

        const props = {
            get: ['id', 'monitor'],
            has: ['focus'],
        }

        const windowList = windows.map((w) => {
            const win = {}
            props.get.forEach((name) => (win[name] = w.meta_window[`get_${name}`]?.()))
            props.has.forEach((name) => (win[name] = w.meta_window[`has_${name}`]?.()))
            win.in_current_workspace = w.meta_window.located_on_workspace?.(workspaceManager.get_active_workspace?.())
            return win
        })

        return JSON.stringify(windowList)
    }

    GetBufferRect(winid) {
        const win = this._getWindowById(winid)
        if (!win) {
            throw new Error('Window not found')
        }
        const { x, y, width, height } = win.meta_window.get_buffer_rect()
        const result = {
            x,
            y,
            width,
            height,
        }
        return JSON.stringify(result)
    }

    GetFrameRect(winid) {
        const win = this._getWindowById(winid)
        if (!win) {
            throw new Error('Window not found')
        }

        let { x, y, width, height } = win.meta_window.get_frame_rect()
        const result = {
            x,
            y,
            width,
            height,
        }
        return JSON.stringify(result)
    }

    GetTitle(winid) {
        let win = this._getWindowById(winid)
        if (win) {
            return win.meta_window.get_title()
        } else {
            throw new Error('Not found')
        }
    }

    MoveToWorkspace(winid, direction) {
        if (direction !== 'left' && direction !== 'right') {
            throw new Error('Invalid action')
        }

        const win = this._getWindowById(winid).meta_window
        if (!win) {
            throw new Error('Window not found')
        }

        const metaWorkspace = win.get_workspace()
        const metaMotionDirection = direction === 'left' ? -3 : -4
        const targetWorkspace = metaWorkspace.get_neighbor(metaMotionDirection)
        if (!targetWorkspace) {
            throw new Error('No neighbor workspace found')
        }

        win.change_workspace(targetWorkspace)
        targetWorkspace.activate_with_focus(win, global.get_current_time())
    }

    Place(winid, x, y, width, height) {
        const win = this._getWindowById(winid)
        if (!win) {
            throw new Error('Window not found')
        }

        const monitorWorkArea = this._getMonitorWorkAreaByWindow(win)
        if (!monitorWorkArea) {
            throw new Error("Failed to get monitor's work area")
        }

        if (height >= monitorWorkArea.height && width >= monitorWorkArea.width) {
            if (win.meta_window.can_maximize()) {
                win.meta_window.maximize(3)
                return
            }
            throw new Error('Provided height/width are out of bounds')
        }

        if (
            !win.meta_window.allows_move() ||
            !win.meta_window.allows_resize() ||
            win.meta_window.maximized_horizontally ||
            win.meta_window.maximized_vertically
        ) {
            win.meta_window.unmaximize(3)
            if (!win.meta_window.allows_move() || !win.meta_window.allows_resize()) {
                win.meta_window.maximize(3)
                throw new Error('Window is not moveable or resizeable')
            }
        }

        if (width >= monitorWorkArea.width) {
            win.meta_window.move_resize_frame(true, x, y, monitorWorkArea.width, height)
            // Maximize horizontally
            win.meta_window.maximize(1)
            return
        }

        if (height >= monitorWorkArea.height) {
            win.meta_window.move_resize_frame(true, x, y, width, monitorWorkArea.height)
            // Maximize vertically
            win.meta_window.maximize(2)
            return
        }

        win.meta_window.move_resize_frame(true, x, y, width, height)
    }

    GetFocusedMonitorDetails() {
        const id = global.display.get_current_monitor()
        const monitorGeometryMtkRect = global.display.get_monitor_geometry(id)
        const geometry = {
            x: monitorGeometryMtkRect.x,
            y: monitorGeometryMtkRect.y,
            width: monitorGeometryMtkRect.width,
            height: monitorGeometryMtkRect.height,
        }
        return JSON.stringify({ id, geometry })
    }

    Move(winid, x, y) {
        let win = this._getWindowById(winid)
        if (win) {
            if (win.meta_window.maximized_horizontally || win.meta_window.maximized_vertically) {
                win.meta_window.unmaximize(3)
            }
            win.meta_window.move_frame(1, x, y)
        } else {
            throw new Error('Not found')
        }
    }

    Maximize(winid) {
        const win = this._getWindowById(winid).meta_window
        if (!win) {
            throw new Error('Window not found')
        }

        win.maximize(3)
    }

    Minimize(winid) {
        const win = this._getWindowById(winid).meta_window
        if (!win) {
            throw new Error('Window not found')
        }

        win.minimize()
    }

    Unmaximize(winid) {
        const win = this._getWindowById(winid).meta_window
        if (!win) {
            throw new Error('Window not found')
        }

        win.unmaximize(3)
    }

    Close(winid) {
        const win = this._getWindowById(winid).meta_window
        if (!win) {
            throw new Error('Window not found')
        }

        win.kill()
    }
}
