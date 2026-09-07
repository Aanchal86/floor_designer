# PlanCraft - Interactive 2D Floor Plan Designer

PlanCraft is an interactive 2D floor plan design application developed using **HTML, CSS, JavaScript, and the HTML Canvas API**.

The application allows users to create simple floor plans, place architectural elements and furniture, transform objects, save designs, and export the final plan as an image.

## Features

- Draw rooms using click-and-drag
- Draw walls on a snap-to-grid canvas
- Add doors and windows
- Add furniture such as:
  - Bed
  - Chair
  - Table
  - Sofa
  - Dining Table
  - Toilet
  - Plant
- Select and move objects
- Rotate objects
- Scale objects
- Rename rooms
- Display room dimensions
- Duplicate objects
- Bring objects to front
- Send objects to back
- Delete objects
- Undo and Redo
- Zoom In, Zoom Out, and Reset Zoom
- Object properties panel
- Save floor plans using Local Storage
- Load previously saved floor plans
- Export floor plans as PNG
- Built-in demonstration floor plan
- Responsive user interface
- Mobile touch support using Pointer Events
- Works with mouse, touch, and stylus input
- Responsive mobile layout

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Pointer Events API
- HTML Canvas API
- Local Storage
- Git
- GitHub
- GitHub Pages

## Computer Graphics Concepts Used

This project demonstrates several important concepts from **Computer Graphics and Multimedia**:

- 2D graphical primitives
- Lines and rectangles
- Coordinate systems
- Grid-based positioning
- Translation
- Rotation
- Scaling
- Canvas transformations
- Object selection
- Hit detection
- Layer ordering
- Interactive graphical user interfaces

## How It Works

The application uses the **HTML Canvas API** to render the floor plan.

Each room, wall, door, window, or furniture item is represented as a JavaScript object containing properties such as position, dimensions, rotation, and scale.

Whenever the user modifies the floor plan, the canvas is redrawn to display the updated design.

A **25-pixel grid** is used for snapping objects to fixed coordinates, making layouts easier to design and align.

## Project Structure

```text
floor_designer/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run

1. Clone the repository:

```bash
git clone https://github.com/Aanchal86/floor_designer.git
```

2. Open the `floor_designer` project folder.

3. Open `index.html` directly in a browser or run it using the **VS Code Live Server** extension.

No additional packages or installations are required.

## Controls

| Action | Control |
|---|---|
| Draw Room | Select Room and click-drag |
| Draw Wall | Select Wall and click-drag |
| Place Furniture | Select furniture and click on canvas |
| Select Object | Select tool and click object |
| Move Object | Drag selected object |
| Rotate Object | Select object and click Rotate |
| Resize Object | Use Scale + or Scale - |
| Rename Room | Select room and click Rename Room |
| Duplicate | `Ctrl + D` |
| Delete | `Delete` |
| Undo | `Ctrl + Z` |
| Redo | `Ctrl + Y` |
| Zoom | Use Zoom + / Zoom - / Reset Zoom |

## Save and Export

PlanCraft supports:

- Saving the current floor plan using browser **Local Storage**
- Loading a previously saved floor plan
- Exporting the completed floor plan as a **PNG image**

This allows users to preserve and share their designs without requiring a backend or database.

## Deployment

The application is deployed using **GitHub Pages**.

Repository:

`https://github.com/Aanchal86/floor_designer`

## Project Objective

The objective of PlanCraft is to demonstrate the practical implementation of **2D computer graphics concepts** through an interactive floor plan designing application.

The project combines graphical primitives, coordinate systems, transformations, object manipulation, user interaction, and graphical interface design in a single browser-based application.

## Future Enhancements

- Drag handles for direct resizing
- Editable property values
- Multiple floor support
- Measurement units in feet or metres
- Curved walls
- Import and export project files
- Additional furniture components
- Pan and advanced zoom controls
- 3D visualization of the created floor plan

## Author

Developed as a **Computer Graphics and Multimedia academic project**.