# Window Commander
This extension aims to provide only what is neccessary for the [ulauncher-window-manager](https://github.com/gnikolaos/ulauncher-window-manager) to work properly.
If you don't plan to use the [ulauncher-window-manager](https://github.com/gnikolaos/ulauncher-window-manager), the extension [window-call](https://github.com/ickyicky/window-calls) by ickyicky might be a better option for you.

## Installation

1. Install from [gnome extensions page](https://extensions.gnome.org/extension/7302/window-commander/).
2. Or clone the repo and run ```make install```

## Usage

### List Windows

To get a list of all the active windows run from terminal:

```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.List
```

Example output:
```json
[
    {
        "id": 1139090783,
        "monitor": 0,
        "focus": false,
        "in_current_workspace": false,
    },
    {
        "id": 8734090787,
        "monitor": 0,
        "focus": true,
        "in_current_workspace": true,
    }
]
```

### Move window to next or previous workspace

To move the given window to the next(right or left for the previous) workspace:

```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.MoveToWorkspace 8734090787 right
```

### Get extra information about a window

- `GetDetails`, which returns detailed information about window in JSON format
- `GetFrameRect`, which returns the rectangle that bounds `window` that is what the user thinks of as the edge of the window.
- `GetBufferRect`, which returns the rectangle that the pixmap or buffer of `window` occupies. For x11 this is the server-side geometry of the toplevel window. For wayland this is the bounding rectangle of the attached buffer.

These methods should be invoked giving the desired window's id as a parameter. Example usages:

`GetDetails`
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.GetDetails 8734090787
```

`GetFrameRect`
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.GetFrameRect 8734090787
```

`GetBufferRect`
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.GetBufferRect 8734090787
```

Example result of calling `GetDetails`:
```json
{
    "id": 8734090787,
    "monitor": 0,
    "wm_class": "gnome-terminal-server",
    "wm_class_instance": "gnome-terminal-server",
    "maximized": 3,
    "focus": true,
    "canMove": true,
    "canResize": false,
    "canClose": true,
    "canMaximize": true,
    "canMinimize": true,
    "windowArea": {
        "x": 0,
        "y": 34,
        "width": 1920,
        "height": 1166
    },
    "currentMonitorWorkArea": {
        "x": 0,
        "y": 34,
        "width": 1920,
        "height": 1166
    },
    "allMonitorsWorkArea": {
        "x": 0,
        "y": 34,
        "width": 1920,
        "height": 1166
    },
    "in_current_workspace": true
}
```

Example result of calling `GetFrameRect` or `GetBufferRect`:
```
{
    "x": 0,
    "y": 34,
    "width": 1920,
    "height": 1166
}
```

### Place Window

Placing a window resizes and moves the provided window simultaneously.

- `Place` takes 5 parameters: winid x y width height

Example usage:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.Place 8734090787 0 34 800 600
```

### Maximize, Unmaximize, Minimize, Unminimize, Close

These 5 Methods provide the functionality their name implies.
They should be invoked giving the desired window's id as a parameter. Example usages:

- `Maximize`
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.Maximize 8734090787
```
- `Minimize`
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.Minimize 8734090787
```

etc...


### Using With `jq`

Because the gdbus call returns its own structure, which is not JSON parsable, you might want to use cut or gawk in order to retrieve pure JSON output from the call.
For example, to get the window list in json you can run:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.List | cut -c 3- | rev | cut -c4- | rev | jq .
```

To get the window id of all windows in current workspace:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.List | cut -c 3- | rev | cut -c4- | rev | jq -c '.[] | select (.in_current_workspace == true) | .id'
```

To get the window id and focus of all windows in current workspace:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.List | cut -c 3- | rev | cut -c4- | rev | jq -c '[.[] | select (.in_current_workspace == true) | {id: .id,wm_class: .focus}]'
```

etc...


### Using with `gawk`

You can also use gawk to capture the desired JSON values. It has to be paired with sed in order to replace escaping done by qawk on quotes. For `List` gawk should look for JSON list:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.List | gawk 'match($0, /\[.*\]/, a) {print a[0]}' | sed 's/\\"/"/g' | jq .
```

And for `Details` you want to find just one dictionary:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowCommander --method org.gnome.Shell.Extensions.WindowCommander.Details 1610090767 | gawk 'match($0, /\{.*\}/, a) {print a[0]}' | sed 's/\\"/"/g' | jq .
```


#### Credits

To [ickyicky](https://github.com/ickyicky) for the original repository, which served as the foundation of this project.

Credits section copied over from the original repository:
Credit to [dceee](https://github.com/dceee) for providing example code in [this discussion](https://gist.github.com/rbreaves/257c3edfa301786e66e964d7ac036269)
and to [blueray453](https://github.com/blueray453) for requesting additional functions and providing code example for additional properties returned by List
method in [issue #1](https://github.com/ickyicky/window-calls/issues/1)
