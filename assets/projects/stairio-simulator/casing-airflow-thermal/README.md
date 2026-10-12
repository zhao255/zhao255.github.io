# Casing airflow and thermal CFD — 2026-10-11

> Website export: reports, figures, the fitted-case airflow video, the earlier thermal video and compact records are bundled here. The first-run arch-open video and its poster are omitted; their numerical records and comparison figures remain available. Native solver archives are not hosted; their former links are plain text. Workstation paths in text records are replaced with `[local archive]/`. The original source hashes are in `source-manifest-sha256.json`; `manifest-sha256.json` hashes these exported files. See `export-provenance.json` for the adaptations and link checks.

Back to current index (local archive; not included in this website export) · Dated evidence (local archive; not included in this website export) · Validation and limits (local archive; not included in this website export)

Steady laminar ANSYS Fluent 2025 R2 pilot of the archived Stairio V7 casing: where the air enters when the FAN-4007 exhausts through the top, and how hot the components and the PLA run. Run 10–11 October 2026 by Claude Code on the user's workstation. This pack is the compact, self-describing record of those results: the two reports, their figures and videos, the small records they cite, the earlier screening reports they build on, a machine-readable summary and a SHA-256 manifest (28 MB). The meshes, Fluent case/data files, CAD and Mechanical databases (28 GB) remain in the local working archive and are not included in this website export.

**Every result is a model with assumed inputs.** The fan flow is an **assumed** 1 CFM (no FAN-4007 pressure–flow curve), the heat loads are **assumed** (no power measurement), the geometry is the archived July CAD with the 36GY motor envelope (not the M2006/C610 now fitted) and three generic boards, and both airflow solutions are accepted only under a documented analyst waiver for qualitative use (their residual aim was not met). No robot was measured, no motor or fan was run, and no PLA qualification is claimed.

## Results in brief

**Airflow** (`fluent-airflow-report.html`). Flow-weighted share of the air entering the casing, from the solved face fluxes:

| Opening | Arch open (first run, as the archived assembly) | Side-shell fitted (main case, as the robot) |
| --- | --- | --- |
| Horizontal side vents, both walls | 22 % | **47 % (23.7 % per side)** |
| From under the casing | 3 % | 37 % (probably overstated: the side-shell's continuation 90 mm below the casing is not modelled) |
| Top grille beside the fan | 9 % | 12 % |
| Gaps around the camera bosses | 0.5 % | 3.6 % |
| Arch on the fan-side face | 66 % | 0 % |

At 1 CFM the modelled fan must raise 4.51 Pa with the side-shell fitted (4.27 Pa with the arch open); that is the casing's resistance in this model, not a fan rating. The average air speed on a plane through the motor-side compartment is 0.062 m/s (0.027 m/s arch open), and 0.16 m/s on a plane through the fan-side bay: slow enough that about 1 K of heating gives comparable buoyant flow.

**Thermal** (`fluent-thermal-report.html`). Energy on that airflow, every non-source wall adiabatic, no radiation, 25 °C room. Per watt, with one source alone and the airflow frozen:

| Source (1 W alone) | Surface rise | Air at the fan | Watts before the PLA touching it reaches 50 °C |
| --- | --- | --- | --- |
| Motor (36GY envelope) | 16.2 K/W | 1.85 K/W | 1.54 W |
| Front board, under the fan | 11.1 K/W | 1.09 K/W | 2.26 W |
| Middle board (the Pi, per the user) | 11.2 K/W | 1.12 K/W | 2.23 W |
| Back board, next to the motor | 14.7 K/W | 1.18 K/W | 1.70 W |
| Cameras, both together | 44.0 K/W | 1.09 K/W | 0.57 W |

With the **assumed** loads (6.75 W: motor 2.5 W, Pi 1.75 W, power manager 1 W on the front board, C610 0.5 W on the back board, cameras 1 W), mean surface temperatures in a 25 °C room:

| Component | Superposed, airflow frozen | All sources together, airflow frozen | Buoyancy on |
| --- | --- | --- | --- |
| Cameras | 69.1 °C | 69.1 °C | **69.9 °C** |
| Motor surface | 66.0 °C | 64.6 °C | **61.0 °C** |
| Pi (middle board) | 49.4 °C | 50.8 °C | **51.1 °C** |
| Power manager (front board) | 45.2 °C | 46.8 °C | **48.1 °C** |
| C610 (back board) | 38.7 °C | 39.0 °C | **38.5 °C** |
| Hottest PLA housing face (a camera boss) | 64.1 °C | 64.2 °C | **about 67 °C** |
| Air at the fan | 34.3 °C | 34.3 °C | **34.5 °C** |

The PLA around the cameras passes the 50 °C review flag over about 1700 mm² (buoyancy on), peaking about 10 mm above each camera axis; PLA touching the motor or the cameras sits well above the flag, and the Pi board is at it. Buoyancy cools the motor by 3.6 K, removes a 54 °C patch on the back wall behind it, and warms the camera bosses by about 3 K. Swapping the two interchangeable boards (C610 front, power manager back) leaves no component cooler. The per-watt values carry about ±25 % from the mesh; the buoyant values are indicative (Boussinesq β·ΔT = 0.15 at the cameras).

## Evidence map

| File | Meaning |
| --- | --- |
| [Airflow report](fluent-airflow-report.html) | Both airflow cases: intake shares, pressure rise, compartment speeds, video, verification, scope. Links to the records below; native Fluent case/data files remain in the local archive. |
| [Thermal report](fluent-thermal-report.html) | Per-watt responses, the assumed-load results with and without buoyancy, housing hot patches, verification, scope. Passed an automated read-only review (18 findings applied; not an independent review). |
| [Airflow video, side-shell fitted](stairio-fluent-airflow.mp4), first-run video, arch open (local archive; not included in this website export) | Native Fluent pathline pulses coloured by speed; playback time is not physical time. Their frame and seeding verification: `report-assets/video-verification-fluent*.json`. |
| `report-assets/` | The reports' figures: intake maps, speed sections, intake paths, convergence, the housing temperature maps (`thermal-scenario-A-housing.png`, `thermal-casing-maps.png`), video posters, and `report-metrics.json` (the airflow report's numbers). |
| `records/airflow/` | Solver-side records: per-opening intake (`opening-fluxes*.json`), final gates and acceptance waivers for both cases, compartment speeds, the arch-band record, the monitor ledger and native report samples, and the lower-RAM configuration check. |
| `records/thermal/` | The thermal plan, per-watt response (`unit-response.json`), the unit runs, the assumed-load scenarios and their superposition results, the calibrated all-source runs (`phaseB-B0-refined.json`, `phaseB-B1-buoyant.json`), housing field summaries, hot patches, near-wall air, and the numerical-defect tests (`330-*`, `333-*`, `bad-cell-clusters.json`). |
| [Machine-readable summary](casing-airflow-thermal-summary.json) | Generated from the records: intake shares, pressure rise, speeds, mesh, the per-watt matrix with cross-heating and conductances, the assumed loads and their results, housing hot patches, uncertainties, and what is not established. Read it before reusing any number in software. |
| `earlier/` | The earlier screening studies' self-contained reports (see below), with their small records; their CAD, meshes and solver databases remain in the local archive. |
| [File manifest](manifest-sha256.json) | SHA-256 and size of every file in this pack except itself. |

## Earlier studies in this pack

Three earlier studies by a Codex agent on 10 October 2026 (ANSYS Mechanical 2025 R2) are copied here as their report pages with the small records they cite; their CAD, meshes, Mechanical databases and solver results stay in the original folders and are identified as local-archive items on each page. None of them is CFD, and none mentions the later Fluent study, so the last column is this pack's reading of both sets of documents.

| Study | What it is | Main numbers (all with assumed inputs) | Relation to the Fluent results |
| --- | --- | --- | --- |
| [Thermal screening](earlier/thermal-screening/thermal-screening-report.html) | Steady conduction in the PLA primary shell alone: 1 W spread over five upper inner sidewall faces, removed only by an assumed exterior film coefficient to a 25 °C room; no fan, air, components or radiation. | Peak shell rise 17.7 / 9.8 / 6.3 K per wall-watt at h = 5 / 10 / 20 W/(m²·K); a 2 mm instead of 3 mm mesh changed the peak by 0.0004 %. | Gives the shell's conduction response, which the Fluent thermal model omits (its PLA is adiabatic). Its per-wall-watt values must not be multiplied by the total electrical power: most of the heat leaves with the air, not through the walls. |
| [Ventilation sensitivity](earlier/airflow-sensitivity/airflow-sensitivity-report.html) | The same shell model coupled to a well-mixed air energy balance: 210 algebraic what-ifs from 8 FE solves over heat 5 / 10 / 20 W, net fresh-air exchange 0.5–3 CFM (the 0 CFM rows are extrapolation diagnostics), room 25 / 35 °C and film coefficients. Not CFD: no fan pressure, local velocity, recirculation or component temperatures. | Illustrative 10 W / 1 CFM / 25 °C case: mixed air 40.9 °C, peak shell 38.1 °C, 8.96 W (90 %) leaving with the air and 1.04 W through the shell; shell conductance 0.065 W/K, ventilation 0.56 W/K per CFM. | The Fluent study resolves what this model assumes (where the air enters, how fast it passes the components) and puts the heat on component surfaces instead of into perfectly mixed air. Its air-at-the-fan rise of 1.1–1.85 K per watt is of the same order as this model's net 1.6 K/W at 1 CFM. Both leave the fan flow assumed. |
| [Native ANSYS thermal video](earlier/ansys-thermal-video/ansys-thermal-video.html) | Transient conduction of the shell with the same lumped air node (10 W into mixed air, 1 CFM assumed, shell starting at 25 °C) over 30 model minutes; 122 native contour frames assembled into a 36 s video. | Peak shell 37.7 °C and mixed air 40.8 °C at 30 model minutes (steady: 38.1 / 40.9 °C). The time axis belongs to this shell-only storage model, not to the robot's warm-up. | The only time-dependent result in this pack; it carries the ventilation model's assumptions and has no component thermal masses. The exhaust arrow in the video is an illustration, not a solved flow. |

A fourth item, the HyperFrames animation project in `../2026-10-10-thermal-video/`, shows the ventilation study's 10 W / 1 CFM endpoint on the archived robot model. It is a visualisation with no new results and no rendered MP4 (five snapshot PNGs), so it is identified here but is not included in this export.

## Findings to carry into the simulator

1. **The casing model must include the side-shell.** The archived V7 assembly omits `side-shell.SLDPRT`, which closes the large arch on the fan-side face; with it open the model took 66 % of its air through that arch and only 22 % through the vents. Any geometry derived from the archive (CFD, Unreal/Blender assets, collision models) needs the arch sealed to represent the robot.
2. **Inside the casing the air is warmer than the room.** With the assumed 6.75 W, the air reaching the fan is about 9.5 K above the room, and the air beside the boards warmer still. The virtual Pi's 23.5 °C environment-sensor default is a room value, not an interior estimate; the BME688's mounting location is not recorded in this pack.
3. **The per-watt table makes any load set a calculation, not a rerun.** With the airflow frozen, the component and housing temperatures for a new set of loads follow from `records/thermal/unit-response.json` by superposition (`thermal_analysis.py <scenario.json>` in the working folder, about a minute); a buoyant rerun takes about an hour from the saved case.
4. **Camera power is the most consequential unknown** (44 K/W; 0.57 W brings the PLA they touch to 50 °C). Measuring the Pi, cameras, power manager and motor + C610 at the real duty cycle turns these pilots into estimates with stated uncertainty.
5. **Board placement:** power manager at the front (under the fan) and C610 at the back is cooler than the swap by 0.7–2.0 K, a margin comparable to the method's own 1.6 K idle-source bias.
6. **Steady state only.** No warm-up time is available; a transient needs the boards' and PLA's thermal masses, which are not in the model.

## Limits

- Fan flow assumed at 1 CFM with a uniform body-force actuator; no fan curve, no swirl, no measured operating point.
- Heat loads assumed; every temperature scales with them.
- Archived CAD: the 36GY motor envelope, generic 60 × 74 mm boards, simplified camera cylinders (about half of each camera's surface sits in its boss gap or in the room air). The real Pi Zero 2 W, power board, M2006 motor and camera modules differ.
- No conduction through the PLA and no radiation: component temperatures lean high; housing faces away from the components could run warmer than shown.
- Steady laminar pilot, no prism layers, no mesh-independence study; the airflow residual aim was not met (documented waiver). Per-watt values about ±25 %.
- The side-shell is modelled only where it closes the arch; its 90 mm continuation below the casing is not modelled, so the underside intake share is probably overstated.
- The outer box is small (open bottom 80 mm below the casing); no floor, stair, enclosure or sun.

## Working folders (local only, not in this pack)

| Folder | Size | Contents |
| --- | --- | --- |
| `../2026-10-10-fluent-airflow/` (local archive; not included in this website export) | 28 GB | The Fluent study: meshing history, case/data files, every command, log, tool and the continuation log (local archive; not included in this website export) with the decisions and Fluent lessons. |
| `../2026-10-10-thermal-study/` | 419 MB | Wall-only shell conduction screening: CAD (STEP/dsco), Mechanical databases, solver files and nodal exports. |
| `../2026-10-10-airflow-study/` | 249 MB | Ventilation sensitivity what-if (shell FE plus well-mixed air balance, not CFD): Mechanical databases, solver files and nodal exports. |
| `../2026-10-10-ansys-video/` | 6.5 GB | Transient shell warm-up video study: two 2.9 GB MAPDL result files, inputs, native frames. |
| `../2026-10-10-thermal-video/` | 139 MB | HyperFrames animation project of the ventilation study's endpoint on the robot model; needs its `node_modules`; no rendered MP4. |
| `../2026-10-09-ansys-terminal-check/`, `../2026-10-10-ansys-terminal-check/` | < 1 MB | Checks that ANSYS Discovery and MAPDL could be driven from the terminal: inputs, transcripts and a small result. |

## Regenerating this pack

From `../2026-10-10-fluent-airflow/`, with the system Python: `solve/claude-tools/build_simulator_pack.py` rebuilds everything here except this README from the study's files and records; `solve/claude-tools/check_pack_links.py` verifies every link; after editing this README run the builder with `--manifest-only` to refresh the manifest. The pack itself never changes the working folders.
