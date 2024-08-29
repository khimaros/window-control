NAME = gnome-window-calls
UUID = $(NAME)@gnikolaos.gr

.PHONY: build install remove clean

build: clean
	mkdir -p build/
	gnome-extensions pack -f \
	    --extra-source=metadata.json \
	    --extra-source=extension.js \
	    -o build/

clean:
	rm -rf build/

install: uninstall build
	gnome-extensions install -f build/$(UUID).shell-extension.zip

uninstall:
	rm -rf  $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
