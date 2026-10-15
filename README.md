# companion-module-nextkon-screen

Bitfocus Companion module for [NextKon Screen](https://nextkon.de/screen/): digital name signs for lecterns, panel tables and door screens.

See [HELP.md](./companion/HELP.md) for setup and usage, and [LICENSE](./LICENSE).

## API used

All requests are plain HTTPS `GET`s against the NextKon Screen server (default `https://screen.nextkon.de`), authenticated by the customer's control key (`zugang`):

| Endpoint                                          | Purpose                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/api/s/stand?zugang=KEY[&v=VERSION]`             | Active event, screens with current sign and online state, names. With a current `v` only the online state is returned. |
| `/api/s/setzen?zugang=KEY&screen=ID&name=NAME_ID` | Show a name; `name=LEER` shows the logo only, `name=AUS` turns the screen black.                                       |
| `/api/s/tauschen?zugang=KEY&a=ID&b=ID`            | Swap the signs of two screens.                                                                                         |

The module polls `/api/s/stand` (default every second). The response for an unchanged state is a few bytes.

## Development

```sh
corepack enable
yarn install
yarn dev        # tsc --watch, point Companion's developer modules path to the parent folder
yarn lint
yarn package    # builds pkg.tgz
```

Requires Node.js 26 (as Companion 4 modules do).
