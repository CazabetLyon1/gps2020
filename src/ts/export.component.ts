import { Component, OnInit } from '@angular/core'

@Component({
  selector: "export-module",
  template: require("../twig/component/export.component.html").toString(),
  styles: [
    require("to-string-loader!../scss/export.component.scss").toString(),
  ]
})

export class ExportComponent implements OnInit {

  private module : HTMLElement = document.querySelector("export-module")

  constructor() {}

  ngOnInit(): void {
    this.init()
  }

  private init = (): void => {
    this.module.querySelector("#export_container").addEventListener("click", (e) => {
      e.stopPropagation()
    })
    this.module.addEventListener("click", () => {
      if(this.module.querySelectorAll("#progress-bar, .file-link").length === 0) {
        this.toggleElements(false).then(() => this.hide())
      } else if(this.module.querySelectorAll("#progress-bar").length === 0 &&
                this.module.querySelectorAll(".file-link").length === 1) {
        let file = this.module.querySelector(".file-link") as HTMLElement
            file.addEventListener("transitionend", () => {
              file.remove()
              this.hide()
            }, {once: true})
            file.style.opacity = "0"
      }
    })
    window.addEventListener("show_export", () => {
      this.show()
    })
    document.querySelector("#classic_method").addEventListener("change", (e) => {
      if((e.target as HTMLInputElement).checked) {
        this.toggleElements(false).then(() => {
          this.createFile(false)
        })
      }
    })
    document.querySelector("#advanced_method").addEventListener("change", (e) => {
      if((e.target as HTMLInputElement).checked) {
        this.toggleElements(false).then(() => {
          window.addEventListener("init_file", () => {
            this.createFile(true)
          }, {once: true})
          dispatchEvent(new CustomEvent("metadata"))
        })
      }
    })
  }

  private createFile = (bool): void => {
    let a = document.createElement("div")
        a.id = "progress-bar"
    let b = document.createElement("div")
    a.appendChild(b)
    this.module.querySelector("#export_container").appendChild(a)
    window.addEventListener("data", (e) => {
      setTimeout(() => {
        b.style.width = "100%"
      }, 300)
      let data = (e as any).detail
      if(!bool) delete data["metadata"]
      let s = this.generateFile(data)
      let blob = new Blob([s], {type: "application/xml"})
      let url = window.URL.createObjectURL(blob)
      let l = document.createElement("a")
          l.className = "file-link"
          l.href = url
          l.download = "file.gpx"
      let span1 = document.createElement("span")
          span1.textContent = this.bytesToSize(blob.size)
      let span2 = document.createElement("span")
      let span21 = document.createElement("span")
          span21.textContent = "Votre fichier"
      let span22 = document.createElement("span")
          span22.textContent = "Fichier GPX"
      span2.appendChild(span21)
      span2.appendChild(span22)
      l.appendChild(span1)
      l.appendChild(span2)
      this.module.querySelector("#export_container").appendChild(l)
      b.addEventListener("transitionend", () => {
        a.remove()
        l.style.opacity = "1"
      }, {once: true})
      //a.click()
      //window.URL.revokeObjectURL(url)
    }, {once: true})
    dispatchEvent(new CustomEvent("need_data"))
  }

  private generateFile = (data): string => {
    let doc = document.implementation.createDocument("", "", null) as XMLDocument
    let gpx = doc.createElement("gpx")
        gpx.setAttribute("version", "1.1")
    if(data.hasOwnProperty("metadata")) {
      let metadata = doc.createElement("metadata")
      if(data.metadata.hasOwnProperty("name") && data.metadata.name !== "") {
        let name = doc.createElement("name")
            name.textContent = data.metadata.name
        metadata.appendChild(name)
      }
      if(data.metadata.hasOwnProperty("desc") && data.metadata.desc !== "") {
        let desc = doc.createElement("desc")
            desc.textContent = data.metadata.desc
        metadata.appendChild(desc)
      }
      if(data.metadata.hasOwnProperty("author")) {
        let author = doc.createElement("author")
        if(data.metadata.author.hasOwnProperty("name") && data.metadata.author.name !== "") {
          let name = doc.createElement("name")
              name.textContent = data.metadata.author.name
          author.appendChild(name)
        }
        if(data.metadata.author.hasOwnProperty("email") && data.metadata.author.email !== "") {
          let email = doc.createElement("email")
          let parts = data.metadata.author.email.split("@")
          if(parts.length > 1) {
            email.id = parts[0]
            email.setAttribute("domain", parts[1])
            metadata.appendChild(email)
          }
        }
        if(author.children.length !== 0) metadata.appendChild(author)
      }
      gpx.appendChild(metadata)
    }
    let trk = doc.createElement("trk")
    let trkseg = doc.createElement("trkseg")
    data.coordinates.forEach((x, i) => {
      let trkpt = doc.createElement("trkpt")
          trkpt.setAttribute("lat", x[0])
          trkpt.setAttribute("lon", x[1])
      let ele = doc.createElement("ele")
          ele.textContent = data.elevations[i]
          trkpt.appendChild(ele)
          trkseg.appendChild(trkpt)
    })
        trk.appendChild(trkseg)
        gpx.appendChild(trk)
    doc.appendChild(gpx)
    let xmlString = '<?xml version="1.0" encoding="UTF-8" ?>'
        xmlString = xmlString + new XMLSerializer().serializeToString(doc)
        doc = new DOMParser().parseFromString(xmlString, "application/xml")
        xmlString = new XMLSerializer().serializeToString(doc)
    return xmlString
  }

  private bytesToSize = (bytes): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))), 10)
    if (i === 0) return `${bytes} ${sizes[i]}`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
  }

  private toggleElements = (show = true): any => {
    return new Promise((resolve, reject) => {
      let a = Array.from(this.module.querySelector("#export_container").children)
      if(!show) a = a.reverse()
      a.forEach((element, i) => {
        setTimeout(() => {
          (element as HTMLElement).style.opacity = show ? (element instanceof HTMLLabelElement && ((element as HTMLElement).previousElementSibling as HTMLInputElement).disabled ? "0.5" : "1") : "0" ;
          (element as HTMLElement).style.transform = `translate(${show ? "0px, 0px" : (element.className === "file-link" ? "-50%, calc(-50% + 40px)" : "0px, 40px")})`
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
    document.body.classList.remove("blur") ;
    (document.querySelector("#classic_method") as HTMLInputElement).checked = false ;
    (document.querySelector("#advanced_method") as HTMLInputElement).checked = false
  }

}
