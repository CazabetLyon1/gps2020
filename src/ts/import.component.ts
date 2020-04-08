import { Component, OnInit } from '@angular/core'

@Component({
  selector: "import-module",
  template: require("../twig/component/import.component.html").toString(),
  styles: [
    require("to-string-loader!../scss/import.component.scss").toString(),
  ]
})

export class ImportComponent implements OnInit {

  private module : HTMLElement = document.querySelector("import-module")
  private LINK_OPTION : HTMLInputElement
  private FILE_OPTION : HTMLInputElement
  private LINK_FIELD : HTMLInputElement
  private FILE_FIELD : HTMLInputElement
  private LINK_BUTTON : HTMLInputElement
  private FILE_BUTTON : HTMLInputElement

  constructor() {}

  ngOnInit(): void {
    this.init()
  }

  private init = (): void => {
    this.LINK_OPTION = document.querySelector("#link_method")
    this.FILE_OPTION = document.querySelector("#file_method")
    this.LINK_FIELD = document.querySelector("#link")
    this.FILE_FIELD = document.querySelector("#file")
    this.LINK_BUTTON = document.querySelector("#send_link")
    this.FILE_BUTTON = document.querySelector("#send_file")
    this.module.querySelector("#import_container").addEventListener("click", (e) => {
      e.stopPropagation()
    })
    this.module.addEventListener("click", () => {
      this.toggleElements(false).then(() => this.hide())
    })
    window.addEventListener("show_import", () => {
      this.show()
    })
    this.LINK_OPTION.addEventListener("change", (e) => {
      this.LINK_BUTTON.disabled = false
      this.FILE_BUTTON.disabled = true
      this.FILE_FIELD.disabled = true
      this.LINK_FIELD.disabled = false
      this.LINK_FIELD.focus()
    })
    this.FILE_OPTION.addEventListener("change", (e) => {
      this.FILE_BUTTON.disabled = false
      this.FILE_FIELD.disabled = false
      this.LINK_BUTTON.disabled = true
      this.LINK_FIELD.disabled = true
    })
    this.LINK_BUTTON.addEventListener("click", () => {
      if(this.LINK_FIELD.value !== "") {
        //let url = "https://raw.githubusercontent.com/gps-touring/sample-gpx/master/RoscoffCoastal/parcours-morlaix-plougasnou.gpx"
        //this.loadGPX(url).then(doc => {
        this.loadGPX(this.LINK_FIELD.value).then(doc => {
          this.parseDocument(doc)
        }).catch(error => {
          console.log(error)
          dispatchEvent(new CustomEvent("notification", {
            detail: {
              title: "Erreur",
              message: "L'URL n'est pas valide"
            }
          }))
        })
      }
    })
    this.FILE_FIELD.addEventListener("change", (e) => {
      document.querySelector("label[for='file']").textContent = this.FILE_FIELD.files[0].name
    })
    this.FILE_FIELD.addEventListener("click", () => {
      console.log('click')
    })
    this.FILE_BUTTON.addEventListener("click", () => {
      if(this.FILE_FIELD.files.length > 0) {
        let file = this.FILE_FIELD.files[0]
        let reader = new FileReader()
            reader.readAsText(file)
            reader.onloadend = () => {
              let parser = new DOMParser()
              let xml = parser.parseFromString(reader.result as any, "application/xml")
              this.parseDocument(xml)
            }
        }
    })
  }

  private parseDocument = (doc): void => {
    this.toggleElements(false).then(() => {
      let a = document.createElement("div")
          a.id = "progress-bar"
      let b = document.createElement("div")
      a.appendChild(b)
      this.module.querySelector("#import_container").appendChild(a)
      let coordinates = []
      let elevations = []
      let informations = {}
      Array.from(doc.querySelector("metadata").children).forEach(tag => {
        let tagName = (tag as HTMLElement).tagName
        if(["name", "desc"].includes(tagName)) {
          informations[tagName] = (tag as HTMLElement).textContent
        } else if(tagName === "author") {
          let author = {}
          Array.from((tag as HTMLElement).children).forEach(subtag => {
            let subtagName = (subtag as HTMLElement).tagName
            if(["name"].includes(subtagName)) {
              author[subtagName] = (subtag as HTMLElement).textContent
            } else if(subtagName === "email") {
              author[subtagName] = (subtag as HTMLElement).id + "@" + (subtag as HTMLElement).getAttribute("domain")
            }
          })
          informations["author"] = author
        }
      })
      let points = Array.from(doc.querySelector("trkseg").children)
      points.forEach((point, i) => {
        setTimeout(() => {
          coordinates.push([parseFloat((point as any).getAttribute("lat")), parseFloat((point as any).getAttribute("lon"))])
          elevations.push(parseFloat((point as any).firstElementChild.textContent))
          b.style.width = ((i+1)/points.length)*100 + "%"
          if(i+1 === points.length) {
            b.addEventListener("transitionend", () => {
              a.remove()
              this.hide()
              dispatchEvent(new CustomEvent("new", {
                detail: {
                  coordinates: coordinates,
                  elevations: elevations,
                  informations: informations
                }
              }))
            }, {once: true})
          }
        }, 100)
      })
    })
  }

  private loadGPX = (url): any => {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open("GET", url, true)
      xhr.responseType = "document"
      xhr.overrideMimeType("text/xml")
      xhr.onload = (data) => {
        if(xhr.readyState === xhr.DONE && xhr.status === 200) {
          resolve((data as any).target.responseXML)
        } else {
          reject("error")
        }
      }
      xhr.send()
    })
  }

  private toggleElements = (show = true): any => {
    return new Promise((resolve, reject) => {
      let a = Array.from(this.module.querySelector("#import_container").children)
      if(!show) a = a.reverse()
      a.forEach((element, i) => {
        setTimeout(() => {
          (element as HTMLElement).style.opacity = show ? "1" : "0" ;
          (element as HTMLElement).style.transform = `translateY(${show ? 0 : 40}px)`
          if(a.length === i+1) {
            element.addEventListener("transitionend", () => {
              //this.hide()
              resolve()
            }, {once: true})
          }
        }, i*50)
      })
    })
  }

  private show = (): void => {
    document.body.classList.add("blur")
    this.module.style.display = "flex"
    this.toggleElements()
  }

  private hide = (): void => {
    //this.toggleElements(false)
    this.module.style.display = "none"
    document.body.classList.remove("blur")
  }

}
