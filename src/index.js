/*
 * LightningChartJS example that showcases simple usage of SurfaceGrid3D.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Extract required parts from LightningChartJS.
const {
    lightningChart,
    SurfaceSeriesTypes3D,
    ColorHSV,
    ColorRGBA,
    IndividualPointFill,
    PalettedFill,
    SolidFill,
    LUT,
    UIOrigins,
    UIBackgrounds,
    UIElementBuilders,
    UILayoutBuilders,
    emptyFill,
    Themes
} = lcjs


const chart3D = lightningChart().Chart3D( {
    // theme: Themes.darkGold
} )
    .setTitle( 'Simple 3D Surface Grid' )

chart3D.getDefaultAxisY()
    .setScrollStrategy( undefined )
    .setInterval( 0, 200 )

// Create color Look-Up-Table for dynamic colouring.
const palette = new LUT( {
    steps: [
        { value: 0, color: ColorRGBA( 0, 0, 0 ) },
        { value: 66, color: ColorRGBA( 255, 0, 0 ) },
        { value: 133, color: ColorRGBA( 0, 255, 0 ) },
        { value: 200, color: ColorRGBA( 0, 0, 255 ) }
    ],
    interpolate: true
} )

const rows = 25
const columns = rows
const surface = chart3D.addSurfaceSeries( {
    type: SurfaceSeriesTypes3D.Grid,
    rows,
    columns,
    start: { x: 0, z: 0 },
    end: { x: 1000, z: 1000 },
    pixelate: true
} )
    // Set Wireframe style.
    .setWireframeStyle( new SolidFill( { color: ColorRGBA( 0, 0, 0, 50 ) } ) )



// Assign a Value to each coordinate of the Grid to be used when colouring by look up value.
surface.invalidateValuesOnly( ( row, column ) =>  row * ( 200 / rows ) )



// Assign a Color to each coordinate of the Grid to be used when colouring by individual color.
// Leave some blanks to showcase fall back color.
surface.invalidateColorsOnly( ( row, column ) => Math.random() >= 0.50 ? ColorHSV( Math.random() * 360 ) : undefined )



// Animate data point heights by a function of time, row and column: y = f( row, column, t )
const y = ( row, column ) => 100 + 4* Math.sin( Date.now() / 500 + (row / rows) * 5 ) * ( Math.cos( (column/columns) * 2.5 ) * 20 )
const update = () => {
    // By passing a function to a invalidation method, the function is called back for each coordinate in the Surface Grid.
    // With the invalidateYOnly variant, the Number returned by the function will be assigned to that data points Y coordinate.
    surface.invalidateYOnly( y )

    requestAnimationFrame( update )
}
update()



// Animate Camera movement from file.
;(async () => {
    const cameraAnimationData = await (
        fetch( document.head.baseURI + 'examples/assets/lcjs_example_0905_3dSimpleSurfaceGrid-camera.json' )
            .then( r => r.json() )
    )
    if ( ! cameraAnimationData ) {
        console.log(`No Camera animation data.`)
        return
    }
    console.log(`Loaded Camera animation data.`)
    let frame = 0
    const nextFrame = () => {
        if ( cameraAnimationEnabledCheckbox.getOn() ) {
            const { cameraLocation } = cameraAnimationData.frames[Math.floor(frame) % cameraAnimationData.frames.length]
            chart3D.setCameraLocation( cameraLocation )
            frame += 1.5
        }
        requestAnimationFrame( nextFrame )
    }
    requestAnimationFrame( nextFrame )
})()



// * UI controls *
const group = chart3D.addUIElement( UILayoutBuilders.Column
    .setBackground( UIBackgrounds.Rectangle )
)
group
    .setPosition( { x: 0, y: 100 } )
    .setOrigin( UIOrigins.LeftTop )
    .setMargin( 10 )
    .setPadding( 4 )
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-height',
        maxHeight: 0.30,
    })


// Add UI controls for changing surface style.
const options = []
const addOption = ( label, onEnabled, defaultSelection = false ) => {
    const checkBox = group.addElement( UIElementBuilders.CheckBox )
        .setText( label )

    if ( defaultSelection ) {
        checkBox.setOn( true )
        onEnabled()
    }

    checkBox.onSwitch( ( _, state ) => {
        if ( state ) {
            onEnabled()
            checkBox.setMouseInteractions( false )
            // Set all other check boxes off.
            options.forEach( option => option.checkBox !== checkBox && option.checkBox.setOn( false ).setMouseInteractions( true ) )
        }
    } )

    options.push( { checkBox } )
}

addOption( 'Color look up by Y', () =>
    // Look up data point color from LUT by Y coordinate
    surface.setFillStyle( new PalettedFill( { lut: palette, lookUpProperty: 'y' } ) )
    , true
)
addOption( 'Color look up by Value', () =>
    // Look up data point color from LUT by number Value associated with it (assigned by user)
    surface.setFillStyle( new PalettedFill( { lut: palette, lookUpProperty: 'value' } ) )
)
addOption( 'Individual Color', () =>
    // Color data points by Colors assigned to each data point.
    surface.setFillStyle( new IndividualPointFill()
        // Specify Color to be used for data points that haven't been assigned a Color.
        .setFallbackColor( ColorRGBA( 100, 0, 0 ) )
    )
)
addOption( 'Solid color', () =>
    // Single solid color.
    surface.setFillStyle( new SolidFill( { color: ColorHSV( Math.random() * 360 ) } ) )
)


// Add UI control for toggling wireframe.
const handleWireframeToggled = ( state ) => {
    // Set Wireframe style.
    surface.setWireframeStyle( state ?
        new SolidFill( { color: ColorRGBA( 0, 0, 0, 50 ) } ) :
        emptyFill
    )
    wireframeCheckbox.setText( state ? 'Hide wireframe' : 'Show wireframe' )
} 
const wireframeCheckbox = group.addElement( UIElementBuilders.CheckBox )
wireframeCheckbox.onSwitch((_, state) => handleWireframeToggled( state ))
wireframeCheckbox.setOn( true )


// Add UI control for toggling camera animation.
const handleCameraAnimationToggled = ( state ) => {
    cameraAnimationEnabledCheckbox.setText( state ? 'Disable camera animation' : 'Enable camera animation' )
    if ( cameraAnimationEnabledCheckbox.getOn() !== state ) {
        cameraAnimationEnabledCheckbox.setOn( state )
    }
}
const cameraAnimationEnabledCheckbox = group.addElement( UIElementBuilders.CheckBox )
cameraAnimationEnabledCheckbox.onSwitch((_, state) => handleCameraAnimationToggled( state ))
handleCameraAnimationToggled( true )
chart3D.onBackgroundMouseDrag(() => {
    handleCameraAnimationToggled( false )
})

// Add LegendBox to chart.
const legend = chart3D.addLegendBox()
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.30,
    })
    .add(chart3D)