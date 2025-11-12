export function setupCounter(element: HTMLButtonElement) {
  let counter = 10
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 10))
  setCounter(0)
}
