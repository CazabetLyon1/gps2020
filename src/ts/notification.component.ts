import { Component, OnInit } from '@angular/core'

@Component({
  selector: "notification-module",
  template: require("../twig/component/notification.component.html").toString(),
  styles: [
    require("to-string-loader!../scss/notification.component.scss").toString(),
  ]
})

export class NotificationComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
    window.addEventListener('notification', () => this.new())
  }

  private new = (): void => {
    let n = document.createElement("div")
        n.className = "notification"
    let img = document.createElement("img")
        img.src = "/img/document.png"
    let span = document.createElement("span")
    let span1 = document.createElement("span")
        span1.textContent = "Erreur"
    let span2 = document.createElement("span")
        span2.textContent = "L'URL n'est pas valide"
    span.appendChild(span1)
    span.appendChild(span2)
    let button = document.createElement("button")
        button.addEventListener('click', () => {
          this.close(n)
        })
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.setAttribute("viewBox", "0 0 34 34")
    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        circle.setAttribute("cy", "17")
        circle.setAttribute("cx", "17")
        circle.setAttribute("r", "15.91549430918954")
        circle.setAttribute("fill", "transparent")
        circle.setAttribute("stroke-width", "1")
        circle.setAttribute("stroke", "black")
        circle.setAttribute("stroke-dashoffset", "26")
        circle.setAttribute("stroke-dasharray", "0 100")
        circle.addEventListener('animationend', () => {
          this.close(n)
        })
    svg.appendChild(circle)
    button.appendChild(svg)
    n.appendChild(img)
    n.appendChild(span)
    n.appendChild(button)
    document.getElementById("notification-center").appendChild(n)
    setTimeout(() => {
      n.style.transform = "translateX(0px)"
    }, 100)
  }

  private close = (notification): void => {
    notification.style.transform = "translateX(-312px)"
    notification.addEventListener('transitionend', () => {
      notification.style.maxHeight = "0px"
      notification.addEventListener('transitionend', () => {
        notification.remove()
      }, {once: true})
    }, {once: true})
  }

}
