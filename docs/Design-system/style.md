{
  "designSystem": {
    "meta": {
      "name": "Cal Design System",
      "version": "2.0",
      "grid": "8pt spacing system"
    },

    "spacing": {
      "scale": [0, 4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112]
    },

    "typography": {
      "fonts": {
        "primary": "Synonym, sans-serif",
        "secondary": "Chillax, sans-serif"
      },
      "scale": {
        "h1": { "size": 32, "lineHeight": 40 },
        "h2": { "size": 24, "lineHeight": 32 },
        "h3": { "size": 18, "lineHeight": 24 },
        "body": { "size": 16, "lineHeight": 22 },
        "small": { "size": 14, "lineHeight": 20 }
      }
    },

    "radius": {
      "base": "1rem",
      "sm": "calc(1rem - 4px)",
      "md": "calc(1rem - 2px)",
      "lg": "1rem",
      "xl": "calc(1rem + 4px)"
    },

    "shadows": {
      "2xs": "0px 0px 0px 0px hsl(0 0% 10% / 0.03)",
      "xs": "0px 0px 0px 0px hsl(0 0% 10% / 0.03)",
      "sm": "0px 0px 0px 0px hsl(0 0% 10% / 0.05), 0px 1px 2px -1px hsl(0 0% 10% / 0.05)",
      "default": "0px 0px 0px 0px hsl(0 0% 10% / 0.05), 0px 1px 2px -1px hsl(0 0% 10% / 0.05)",
      "md": "0px 0px 0px 0px hsl(0 0% 10% / 0.05), 0px 2px 4px -1px hsl(0 0% 10% / 0.05)",
      "lg": "0px 0px 0px 0px hsl(0 0% 10% / 0.05), 0px 4px 6px -1px hsl(0 0% 10% / 0.05)",
      "xl": "0px 0px 0px 0px hsl(0 0% 10% / 0.05), 0px 8px 10px -1px hsl(0 0% 10% / 0.05)",
      "2xl": "0px 0px 0px 0px hsl(0 0% 10% / 0.13)"
    },

    "themes": {
      "light": {
        "base": {
          "dark": "#000000",
          "light": "#ffffff"
        },
        "primary": {
          "a0": "#4c544c",
          "a10": "#444b44",
          "a20": "#3c423c",
          "a30": "#343934",
          "a40": "#2c302c",
          "a50": "#242824"
        },
        "surface": {
          "a0": "#ffffff",
          "a10": "#f0f0f0",
          "a20": "#e1e1e1",
          "a30": "#d3d3d3",
          "a40": "#c5c5c5",
          "a50": "#b6b6b6"
        },
        "surfaceTonal": {
          "a0": "#d8dad8",
          "a10": "#ced0ce",
          "a20": "#c4c5c4",
          "a30": "#babbba",
          "a40": "#b0b1b0",
          "a50": "#a6a7a6"
        },
        "success": {
          "a0": "#1b7f5c",
          "a10": "#28be8a",
          "a20": "#58dbad"
        },
        "warning": {
          "a0": "#b8871f",
          "a10": "#dfae44",
          "a20": "#ebca85"
        },
        "danger": {
          "a0": "#b13535",
          "a10": "#d06262",
          "a20": "#e29d9d"
        },
        "info": {
          "a0": "#1e56a3",
          "a10": "#347ada",
          "a20": "#74a4e6"
        }
      },
      "dark": {
        "base": {
          "dark": "#000000",
          "light": "#ffffff"
        },
        "primary": {
          "a0": "#4c544c",
          "a10": "#5e655e",
          "a20": "#707770",
          "a30": "#838983",
          "a40": "#979c97",
          "a50": "#abafab"
        },
        "surface": {
          "a0": "#121212",
          "a10": "#282828",
          "a20": "#3f3f3f",
          "a30": "#575757",
          "a40": "#717171",
          "a50": "#8b8b8b"
        },
        "surfaceTonal": {
          "a0": "#1d1f1d",
          "a10": "#323432",
          "a20": "#484a48",
          "a30": "#5f615f",
          "a40": "#787978",
          "a50": "#919391"
        },
        "success": {
          "a0": "#22946e",
          "a10": "#47d5a6",
          "a20": "#9ae8ce"
        },
        "warning": {
          "a0": "#a87a2a",
          "a10": "#d7ac61",
          "a20": "#ecd7b2"
        },
        "danger": {
          "a0": "#9c2121",
          "a10": "#d94a4a",
          "a20": "#eb9e9e"
        },
        "info": {
          "a0": "#21498a",
          "a10": "#4077d1",
          "a20": "#92b2e5"
        }
      }
    }
  }
}


<link href="https://api.fontshare.com/v2/css?f[]=synonym@400,600,700&f[]=chillax@300,600&display=swap" rel="stylesheet">
And include these CSS rules
font-family: 'Synonym', sans-serif;
font-family: 'Chillax', sans-serif;