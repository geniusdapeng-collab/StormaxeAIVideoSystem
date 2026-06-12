#!/usr/bin/env node
/**
 * State Bus — persona-state.json 共享状态总线
 * 所有 Agent 通过 State Bus 读写角色灵魂档案
 */
const fs = require('fs');
const path = require('path');

function createPersonaState(projectName) {
  return {
    version: '1.0',
    project: projectName || 'Untitled',
    lastUpdated: new Date().toISOString(),
    characters: {},
    wounds: {},
    gravity: {},
    empathy: {},
    evolution: {},
    mirrors: [],
    consistencyLog: []
  };
}

function loadState(statePath) {
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch {
      return createPersonaState();
    }
  }
  return createPersonaState();
}

function saveState(statePath, state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function getCharacter(state, charId) {
  return state.characters[charId] || null;
}

function setWound(state, charId, woundProfile) {
  state.wounds[charId] = woundProfile;
  if (state.characters[charId]) {
    state.characters[charId].hasWound = true;
  }
}

function setGravity(state, charId, gravityMap) {
  state.gravity[charId] = gravityMap;
}

function setEmpathy(state, charId, empathyMatrix) {
  state.empathy[charId] = empathyMatrix;
}

function setEvolution(state, charId, evolutionTrack) {
  state.evolution[charId] = evolutionTrack;
}

function setMirrors(state, mirrors) {
  state.mirrors = mirrors;
}

function addConsistencyLog(state, report) {
  state.consistencyLog.push(report);
}

function getCharacterPersona(state, charId) {
  return {
    character: state.characters[charId],
    wound: state.wounds[charId],
    gravity: state.gravity[charId],
    empathy: state.empathy[charId],
    evolution: state.evolution[charId]
  };
}

module.exports = {
  createPersonaState,
  loadState,
  saveState,
  getCharacter,
  setWound,
  setGravity,
  setEmpathy,
  setEvolution,
  setMirrors,
  addConsistencyLog,
  getCharacterPersona
};
