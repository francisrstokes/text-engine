const util = require('../../util');

const NOTHING_TO_TAKE = 'There\'s nothing to take.';
const YOU_CANT_TAKE = 'You can\'t take that.';
const WHICH_ITEM = 'Which item?';
const NONE = '[None]';

const YOU_ADD_1 = 'You add';
const YOU_ADD_2 = 'to your inventory.';

const getItemAddedString = (item) => {
  const prefix = (item.prefix)
    ? ` ${item.prefix}`
    : '';
  return `${YOU_ADD_1}${prefix} ${item.name} ${YOU_ADD_2}`;
};

module.exports = async (state, world, input, output) => {
  const visibleItems = world.rooms[state.location].items.filter(util.items.itemIsVisible);

  if (visibleItems.length) {
    const names = [...visibleItems.map(item => item.name), NONE];
    const chosenItemName = await input.choice(WHICH_ITEM, names);
    if (chosenItemName !== NONE) {
      const chosenItem = visibleItems.find(item => item.name === chosenItemName);

      let continueAfterHook = await util.hookEvent(world.items[chosenItem], 'onBeforeTake', state, world);
      if (!continueAfterHook) return;

      if (util.items.itemIsTakeable(chosenItem)) {
        world.rooms[state.location].items = world.rooms[state.location].items.filter(roomItem => roomItem.name !== chosenItemName);
        state.inventory.push(chosenItem);

        const takeText = (chosenItem.state.takeText)
          ? chosenItem.state.takeText
          : getItemAddedString(chosenItem);

        output.writeLine(takeText);
      } else {
        const cantTakeText = (chosenItem.state.cantTakeText)
          ? chosenItem.state.cantTakeText
          : YOU_CANT_TAKE;
        output.writeLine(cantTakeText);
      }

      continueAfterHook = await util.hookEvent(world.items[chosenItem], 'onAfterTake', state, world);
      if (!continueAfterHook) return;
    }
  } else {
    output.writeLine(NOTHING_TO_TAKE);
  }

  output.newLine();
};
