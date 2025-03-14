import {useApp, render}     from 'ink';
import React                from 'react';
import {Readable, Writable} from 'stream';

import {Application}        from '../components/Application';
import {useKeypress}        from '../hooks/useKeypress';

type InferProps<T extends React.ComponentType> = T extends React.ComponentType<infer P> ? P : never;

export type SubmitInjectedComponent<T, C extends React.ComponentType = React.ComponentType> = React.ComponentType<InferProps<C> & {useSubmit: (value: T) => void}>;

export type RenderFormOptions = {
  stdin: Readable;
  stdout: Writable;
  stderr: Writable;
};

export async function renderForm<T, C extends React.ComponentType = React.ComponentType>(UserComponent: SubmitInjectedComponent<T, C>, props: InferProps<C>, {stdin, stdout, stderr}: RenderFormOptions) {
  let returnedValue: T | undefined;

  const useSubmit = (value: T) => {
    const {exit} = useApp();

    useKeypress({active: true}, (ch, key) => {
      if (key.name !== `return`)
        return;

      returnedValue = value;
      exit();
    }, [
      exit,
      value,
    ]);
  };

  const {waitUntilExit} = render(
    <Application>
      <UserComponent {...props} useSubmit={useSubmit}/>
    </Application>,
    {
      stdin: stdin as NodeJS.ReadStream,
      stdout: stdout as NodeJS.WriteStream,
      stderr: stderr as NodeJS.WriteStream,
    },
  );

  await waitUntilExit();
  return returnedValue;
}
