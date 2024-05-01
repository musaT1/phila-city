import { useActiveViewport } from "@itwin/appui-react";
import React, { useEffect } from "react";
import RealityDataApi from "./RealityDataApi";
import "./MyFirstWidget.css";
import { Button, ToggleSwitch } from "@itwin/itwinui-react";
import { ColorDef, ContextRealityModelProps } from "@itwin/core-common";
import { ColorPickerButton } from "@itwin/imodel-components-react";


export const MyFirstWidget: React.FC = () => {
  const viewport = useActiveViewport();

  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [realityModels, setRealityModelList] = React.useState<ContextRealityModelProps[]>([]);
  const [classifier, setClassifier] = React.useState<string>("");
  const [listOfThings, setListOfThings] = React.useState<string[]>([]);
  const [hiliteColor, setHiliteColor] = React.useState<ColorDef>(ColorDef.green);
  useEffect(() => {
    const asyncInitialize = async () => {
      if (viewport) {
        const realityModels = await RealityDataApi.getRealityModels(viewport.iModel);
        setRealityModelList(realityModels);
        const classifiers = await RealityDataApi.getAvailableClassifierListForViewport(viewport);
        if(classifiers) {
          setClassifier(classifiers[0].value);
        }
        setHiliteColor(viewport.hilite.color);
      }
    };

    if (!initialized) {
      void asyncInitialize().then (() => { setInitialized(true);})
    }
  });

  const togglePhillyReality = async (e:React.ChangeEvent<HTMLInputElement>) => {
    if (viewport) {
      for (const model of realityModels) {
        if (model.name === "Philadelphia_2015") {
          RealityDataApi.toggleRealityModel(model, viewport, e.target.checked);
          RealityDataApi.setRealityDataClassifier(viewport, classifier);
        }
      }
    }
  }

  const addSplendid = async () => {
    
    setListOfThings([...listOfThings, "SPLENDID!"])
  }

  const removeTop = async () => {
    setListOfThings(listOfThings.splice(1))
  }
  const onColorChange = async (newColor: ColorDef) => {
    if (viewport) {
      setHiliteColor (newColor)  
      viewport.hilite = {...viewport.hilite, color: newColor};
    }
  }

  const thingList = listOfThings.map((thing: string) => <li>{thing}</li>)

  function addApple(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div>
      This is my first widget, hello newName
      <ToggleSwitch onChange={togglePhillyReality} label='Philly Reality Data'></ToggleSwitch>
      <ColorPickerButton initialColor={hiliteColor} onColorPick={onColorChange} />
      Select hilte color
      <Button onClick={addSplendid}>Add Splendid</Button>
      <Button onClick={addApple}>Add Apple</Button>
      <Button onClick={removeTop}>Remove Top</Button>
      
      <ul>
        {thingList}
      </ul>
      </div>
  );
};
    



