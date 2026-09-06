# PlanCraft - Interactive 2D Floor Plan Designer

PlanCraft is an interactive 2D floor plan design application developed using HTML, CSS, JavaScript, and the HTML Canvas API.

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
- Zoom In, Zoom Out and Reset Zoom
- Object properties panel
- Save floor plan using Local Storage
- Load previously saved floor plan
- Export floor plan as PNG
- Built-in demonstration floor plan
- Responsive user interface

## Technologies Used

- HTML5
- CSS3
- JavaScript
- HTML Canvas API
- Local Storage
- Git
- GitHub
- GitHub Pages

## Computer Graphics Concepts Used

This project demonstrates several important concepts from Computer Graphics and Multimedia:

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

The application uses the HTML Canvas API to render the floor plan.

Each room, wall, door, window, or furniture item is represented as a JavaScript object containing properties such as position, dimensions, rotation, and scale.

The canvas is redrawn whenever the user modifies the floor plan.

A 25-pixel grid is used for snapping objects to fixed coordinates, making the layout easier to design.

## Project Structure

```text
floor_designer/
│
├── index.html
├── style.css
├── script.js
└── README.md

How to Run
Clone the repository.
git clone https://github.com/YOUR_USERNAME/floor_designer.git
Open the project folder.
Open index.html in a browser or run it using the VS Code Live Server extension.

No additional packages or installations are required.

Controls
Room / Wall: Click and drag
Furniture: Click on the canvas to place
Select: Click an object
Move: Drag a selected object
Rotate: Select an object and click Rotate
Scale: Use Scale + or Scale -
Delete: Select an object and press Delete
Duplicate: Ctrl + D
Undo: Ctrl + Z
Redo: Ctrl + Y
Deployment

The application is deployed using GitHub Pages.

Project Objective

The objective of PlanCraft is to demonstrate the practical implementation of 2D computer graphics concepts through an interactive floor plan designing application.

It combines graphical primitives, transformations, object manipulation, user interaction, and multimedia interface design in a single browser-based application.

Future Enhancements
Drag handles for direct resizing
Editable property values
Multiple floor support
Measurement units in feet/metres
Curved walls
Import and export project files
More furniture components
Pan and advanced zoom controls
3D visualization of the created floor plan
Author

Developed as a Computer Graphics and Multimedia academic project.

```text
Aanchal86