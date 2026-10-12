"""Render actual MAPDL result sets through ANSYS Mechanical's native viewport.

Run Mechanical GUI mode (-x -script, no -b). ACT context graphics are omitted
by Mechanical's offscreen ExportAnimation / custom-resolution image exports,
so each frame intentionally uses native current-viewport ExportImage.
"""
import os,json,traceback,time,csv
import Ansys
from Ansys.ACT.Math import Vector3D
from System import Array, Double, Int32
OUT=r'[local archive]/Github\stairio\apps\stairio simulator\evidence\2026-10-10-ansys-video'
FRAME_DIR=os.path.join(OUT,'native-frames')
for view in ['whole','detail']:
    folder=os.path.join(FRAME_DIR,view)
    if not os.path.isdir(folder):os.makedirs(folder)
log=open(os.path.join(OUT,'native-render.log'),'w')
manifest={'renderer':'ANSYS Mechanical 2025 R2 native GUI viewport ExportImage',
          'solver_result_file':os.path.join(OUT,'stairio_transient.rth'),
          'context_geometry':'robot-context-mesh.json',
          'context_role':'97 neutral-gray CAD meshes are graphics only, not thermal analysis bodies',
          'contour':'PLA shell computed temperature; fixed 25..40 C legend',
          'fan_arrow':'Native ANSYS graphical arrow; assumed +Z exhaust direction, not CFD velocity or plume',
          'views':['whole','detail'],'frames':[],'status':'running'}
def note(s):
    log.write(str(s)+'\n');log.flush()
def save_manifest():
    with open(os.path.join(OUT,'native-frames-manifest.json'),'w') as f:json.dump(manifest,f,indent=2)
def set_legend():
    legend=Ansys.Mechanical.Graphics.Tools.CurrentLegendSettings()
    legend.NumberOfBands=10
    legend.SetLowerBound(0,Quantity('25 [C]'))
    legend.SetUpperBound(9,Quantity('40 [C]'))
def set_camera(view):
    camera=ExtAPI.Graphics.Camera
    camera.ViewVector=Vector3D(1,-1,.25)
    camera.UpVector=Vector3D(0,0,1)
    if view=='whole':
        camera.FocalPoint=Ansys.Mechanical.Graphics.Point([0.,0.,-.172],'m')
        camera.SceneHeight=Quantity('.70 [m]')
        camera.SceneWidth=Quantity('1.148 [m]')
    else:
        camera.FocalPoint=Ansys.Mechanical.Graphics.Point([0.,-.005,.068],'m')
        camera.SceneHeight=Quantity('.23 [m]')
        camera.SceneWidth=Quantity('.3772 [m]')
try:
    ExtAPI.DataModel.Project.Open(os.path.join(OUT,'native-render-base.mechdb'))
    Model=ExtAPI.DataModel.Project.Model
    analysis=Model.Analyses[0]
    # The transient file intentionally retains temperatures and energy terms,
    # not element heat-flux vectors. Remove the inherited steady flux result,
    # whose missing TFSUM data otherwise invalidates EvaluateAllResults.
    for obj in list(analysis.Solution.Children):
        if 'HeatFlux' in str(obj.GetType()):obj.Delete()
    temp=[x for x in analysis.Solution.Children if hasattr(x,'Maximum')][0]
    analysis.Name='STAIRIO / 10 W / 1 CFM / 25 C ambient'
    temp.Name='PLA shell temperature'
    context=json.load(open(os.path.join(OUT,'robot-context-mesh.json')))
    vertices=Array[Double]([x*1000. for x in context['vertices']])
    normals=Array[Double](context['normals'])
    triangles=Array[Int32](context['triangles'])
    del context
    note('PROJECT AND CONTEXT READY')
    ExtAPI.Graphics.GlobalLegendSettings.ShowDateAndTime=False
    ExtAPI.Graphics.GlobalLegendSettings.ShowMinMax=False
    ExtAPI.Graphics.ViewOptions.ResultPreference.ShowMaximum=False
    ExtAPI.Graphics.ViewOptions.ResultPreference.ShowMinimum=False
    ExtAPI.Graphics.ViewOptions.ShowRuler=False
    ExtAPI.Graphics.ViewOptions.ShowTriad=False
    shell=None;arrow=None
    def frame(index,time_s,result_set):
        global shell,arrow
        for obj in [shell,arrow]:
            if obj is not None:
                try:obj.Delete()
                except:pass
        temp.By=SetDriverStyle.ResultSet
        temp.SetNumber=result_set
        temp.EvaluateAllResults()
        temp.Activate()
        set_legend()
        # Explicit maximum logging validates that a new physical result set was read.
        maximum=float(temp.Maximum.Value)
        minimum=float(temp.Minimum.Value)
        if time_s==0:expected_max=25.;expected_min=25.
        else:
            expected_row=history[result_set]
            expected_max=float(expected_row['shell_peak_c'])
            expected_min=float(expected_row['shell_min_c'])
        if max(abs(maximum-expected_max),abs(minimum-expected_min))>1e-4:
            raise RuntimeError('Native result mismatch at %ss: native=(%s,%s), MAPDL=(%s,%s)'%(time_s,maximum,minimum,expected_max,expected_min))
        note('FRAME %03d TIME %s SET %s MAX %.7f MIN %.7f'%(index,time_s,result_set,maximum,minimum))
        shell=ExtAPI.Graphics.Scene.Factory3D.CreateShell(vertices,normals,triangles)
        shell.Color=0x87929f
        arrow=ExtAPI.Graphics.Scene.Factory3D.CreateArrow(35.,9.,1.5,4.)
        arrow.Transformation3D.Translate(0.,-28.5,116.)
        arrow.Color=0x4ba6df if time_s==0 else 0xef7537
        arrow.DepthTest=True
        files={}
        for view in ['whole','detail']:
            ExtAPI.Graphics.ViewOptions.ShowLegend=(view=='detail')
            set_camera(view)
            path=os.path.join(FRAME_DIR,view,'frame_%03d.png'%index)
            ExtAPI.Graphics.ExportImage(path)
            files[view]=path
        manifest['frames'].append({'index':index,'time_s':time_s,'result_set':result_set,
                                   'shell_peak_c':maximum,'shell_min_c':minimum,'images':files})
        save_manifest()
    initial=os.path.join(OUT,'stairio_initial.rth')
    analysis.Solution.ReadGivenAnsysResultFileByReference(initial,UnitSystemIDType.UnitsMKS)
    note('COLD INITIAL FILE IMPORTED')
    frame(0,0,1)
    note('WAITING FOR TRANSIENT READY FLAG')
    while not os.path.isfile(os.path.join(OUT,'native-transient-ready.flag')):time.sleep(2)
    history=dict((int(float(row['set'])),row) for row in csv.DictReader(open(os.path.join(OUT,'transient_history.csv'))))
    analysis.Solution.ReadGivenAnsysResultFileByReference(os.path.join(OUT,'stairio_transient.rth'),UnitSystemIDType.UnitsMKS)
    note('TRANSIENT FILE IMPORTED')
    # Produce final endpoint proof early, then sequential frames for the movie.
    times=[5]+list(range(15,1801,15))
    for index,time_s in enumerate(times,1):frame(index,time_s,time_s//5)
    manifest['status']='complete'
    manifest['frame_count']=len(manifest['frames'])
    save_manifest()
    note('ALL FRAMES COMPLETE')
except:
    manifest['status']='failed';manifest['error']=traceback.format_exc()
    save_manifest();note(manifest['error'])
note('DONE')
log.close()
